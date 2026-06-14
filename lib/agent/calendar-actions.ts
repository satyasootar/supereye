import { db } from '@/lib/db';
import { calendarEvents } from '@/lib/db/schema';
import { getTenant } from '@/lib/corsair';
import { sseEmitter } from '@/lib/sse/emitter';
import { resolveEventWindow, type EventTimeInput } from '@/lib/agent/datetime';

export type CreateCalendarEventInput = EventTimeInput & {
  summary: string;
  description?: string;
  location?: string;
  attendees?: string[];
};

type CalendarEventPayload = {
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees?: { email: string }[];
};

function isCorsairError(value: unknown): value is { error: string } {
  return (
    !!value &&
    typeof value === 'object' &&
    'error' in value &&
    typeof (value as { error: unknown }).error === 'string'
  );
}

function assertCreatedEvent(created: unknown, action: string) {
  if (isCorsairError(created)) {
    throw new Error(`${action} failed: ${created.error}`);
  }
  if (!created || typeof created !== 'object' || !('id' in created) || !created.id) {
    throw new Error(`${action} failed: Google Calendar did not return an event id`);
  }
}

function buildEventPayload(input: CreateCalendarEventInput): {
  event: CalendarEventPayload;
  startUtc: Date;
  endUtc: Date;
} {
  const window = resolveEventWindow(input);

  return {
    event: {
      summary: input.summary,
      description: input.description,
      location: input.location,
      start: window.start,
      end: window.end,
      attendees: input.attendees?.map((email) => ({ email })),
    },
    startUtc: window.startUtc,
    endUtc: window.endUtc,
  };
}

/**
 * Create a Google Calendar event via Corsair using timezone-aware local times.
 * Corsair expects `event`, NOT Google's raw `resource` parameter.
 */
export async function createCalendarEventForUser(
  userId: string,
  input: CreateCalendarEventInput
) {
  const tenant = getTenant(userId);
  const { event, startUtc, endUtc } = buildEventPayload(input);

  const created = await tenant.googlecalendar.api.events.create({
    calendarId: 'primary',
    event,
  });

  assertCreatedEvent(created, 'Calendar event creation');

  await db
    .insert(calendarEvents)
    .values({
      userId,
      googleEventId: created.id!,
      calendarId: 'primary',
      title: created.summary,
      description: created.description,
      location: created.location,
      startTime: startUtc,
      endTime: endUtc,
      isAllDay: false,
      status: created.status || 'confirmed',
      attendees: created.attendees
        ? created.attendees.map((a: { email?: string; displayName?: string; responseStatus?: string }) => ({
            email: a.email,
            displayName: a.displayName,
            responseStatus: a.responseStatus,
          }))
        : null,
      htmlLink: created.htmlLink,
      colorId: created.colorId,
    })
    .onConflictDoUpdate({
      target: [calendarEvents.userId, calendarEvents.googleEventId],
      set: {
        title: created.summary,
        description: created.description,
        location: created.location,
        startTime: startUtc,
        endTime: endUtc,
        htmlLink: created.htmlLink,
        updatedAt: new Date(),
      },
    });

  sseEmitter.emit(userId, { type: 'calendar:updated' });

  return created;
}

type RawCreateParams = {
  calendarId?: string;
  event?: Record<string, unknown>;
  resource?: Record<string, unknown>;
};

/**
 * Normalize Google/Corsair create params (including mistaken `resource` usage)
 * into our validated create helper.
 */
export async function createCalendarEventFromRawParams(
  userId: string,
  params: RawCreateParams,
  defaultTimeZone?: string
) {
  const raw = params.event ?? params.resource;
  if (!raw || typeof raw !== 'object') {
    throw new Error('Calendar create requires event: { summary, start, end }');
  }

  const summary = typeof raw.summary === 'string' ? raw.summary : '';
  if (!summary.trim()) {
    throw new Error('Event summary is required');
  }

  const start = raw.start as { dateTime?: string; date?: string; timeZone?: string } | undefined;
  const end = raw.end as { dateTime?: string; date?: string; timeZone?: string } | undefined;
  const timeZone = start?.timeZone ?? end?.timeZone ?? defaultTimeZone;

  const startValue = start?.dateTime ?? start?.date;
  const endValue = end?.dateTime ?? end?.date;

  if (!startValue || !endValue) {
    throw new Error('Event start and end times are required');
  }

  const attendees = Array.isArray(raw.attendees)
    ? raw.attendees
        .map((a) => (typeof a === 'string' ? a : (a as { email?: string }).email))
        .filter((email): email is string => typeof email === 'string' && email.length > 0)
    : undefined;

  return createCalendarEventForUser(userId, {
    summary,
    description: typeof raw.description === 'string' ? raw.description : undefined,
    location: typeof raw.location === 'string' ? raw.location : undefined,
    startDateTime: startValue,
    endDateTime: endValue,
    timeZone,
    attendees,
  });
}

export function createScriptTenant(userId: string, defaultTimeZone?: string) {
  const tenant = getTenant(userId);
  const eventsApi = tenant.googlecalendar.api.events;

  return {
    ...tenant,
    googlecalendar: {
      ...tenant.googlecalendar,
      api: {
        ...tenant.googlecalendar.api,
        events: {
          ...eventsApi,
          create: (params: RawCreateParams) =>
            createCalendarEventFromRawParams(userId, params, defaultTimeZone),
        },
      },
    },
  };
}

export function extractToolFailure(output: unknown): string | null {
  if (!output) return 'Tool returned no result';
  if (typeof output === 'string') return null;
  if (typeof output !== 'object') return null;

  if ('error' in output && typeof output.error === 'string') {
    return output.error;
  }

  if ('success' in output && output.success === false) {
    const message = 'message' in output && typeof output.message === 'string' ? output.message : 'Action failed';
    return message;
  }

  return null;
}
