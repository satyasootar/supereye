import { db } from '@/lib/db';
import { calendarEvents } from '@/lib/db/schema';
import { sseEmitter } from '@/lib/sse/emitter';
import { resolveEventWindow, type EventTimeInput, resolveTimeZone, getTodayInTimezone, zonedLocalToUtc } from '@/lib/agent/datetime';
import { and, eq } from 'drizzle-orm';
import { createGoogleCalendarEvent } from '@/lib/calendar/create-event';
import { getTenant } from '@/lib/corsair';

export type CreateCalendarEventInput = EventTimeInput & {
  summary: string;
  description?: string;
  location?: string;
  attendees?: string[];
  addGoogleMeet?: boolean;
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
  const { event, startUtc, endUtc } = buildEventPayload(input);

  const created = await createGoogleCalendarEvent(userId, {
    summary: event.summary,
    description: event.description,
    location: event.location,
    start: event.start,
    end: event.end,
    attendees: event.attendees,
    addGoogleMeet: input.addGoogleMeet,
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
        ? (created.attendees as Array<{ email?: string; displayName?: string; responseStatus?: string }>)
            .filter((a): a is { email: string; displayName?: string; responseStatus?: string } => typeof a.email === 'string')
            .map((a) => ({
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

export type CalendarEventSummary = {
  id: string;
  summary: string;
  start?: string;
  end?: string;
  attendees?: string[];
};

function dayBounds(date: string, timeZone: string) {
  const start = zonedLocalToUtc(date, '00:00', timeZone);
  const end = zonedLocalToUtc(date, '23:59', timeZone);
  end.setMinutes(59, 59, 999);
  return { start, end };
}

function formatEventTime(
  start: { dateTime?: string; date?: string } | undefined,
  timeZone: string
): string | undefined {
  if (!start?.dateTime && !start?.date) return undefined;
  const value = start.dateTime ?? start.date;
  if (!value) return undefined;
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }).format(instant);
}

function normalizeGoogleEvent(
  event: {
    id?: string;
    summary?: string;
    start?: { dateTime?: string; date?: string };
    end?: { dateTime?: string; date?: string };
    attendees?: Array<{ email?: string }>;
  },
  timeZone: string
): CalendarEventSummary | null {
  if (!event.id) return null;
  return {
    id: event.id,
    summary: event.summary || 'Untitled event',
    start: formatEventTime(event.start, timeZone),
    end: formatEventTime(event.end, timeZone),
    attendees: event.attendees
      ?.map((a) => a.email)
      .filter((email): email is string => !!email),
  };
}

/** List events for a day from live Google Calendar (not stale cache). */
export async function listCalendarEventsForUser(
  userId: string,
  options?: { date?: string; timeZone?: string }
) {
  const tenant = getTenant(userId);
  const timeZone = resolveTimeZone(options?.timeZone);
  const date = options?.date ?? getTodayInTimezone(timeZone);
  const { start, end } = dayBounds(date, timeZone);

  const result = await tenant.googlecalendar.api.events.getMany({
    calendarId: 'primary',
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 250,
  });

  if (isCorsairError(result)) {
    throw new Error(`Failed to list events: ${result.error}`);
  }

  const items = Array.isArray(result.items) ? result.items : [];
  return {
    date,
    timeZone,
    events: items
      .map((event: any) => normalizeGoogleEvent(event, timeZone))
      .filter((event: any): event is CalendarEventSummary => !!event),
  };
}

async function removeLocalCalendarEvent(userId: string, googleEventId: string) {
  await db
    .delete(calendarEvents)
    .where(
      and(eq(calendarEvents.userId, userId), eq(calendarEvents.googleEventId, googleEventId))
    );
}

/** Delete one event by Google event id (`id` from list_calendar_events). */
export async function deleteCalendarEventForUser(userId: string, googleEventId: string) {
  const tenant = getTenant(userId);
  const id = googleEventId.trim();
  if (!id) throw new Error('Google event id is required');

  let removedFromGoogle = true;

  try {
    const result = await tenant.googlecalendar.api.events.delete({
      calendarId: 'primary',
      id,
    });

    if (isCorsairError(result)) {
      if (!/not found/i.test(result.error)) {
        throw new Error(`Delete failed: ${result.error}`);
      }
      removedFromGoogle = false;
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/not found/i.test(msg)) {
      removedFromGoogle = false;
    } else {
      throw e instanceof Error ? e : new Error(msg);
    }
  }

  await removeLocalCalendarEvent(userId, id);
  sseEmitter.emit(userId, { type: 'calendar:updated' });

  return { success: true, id, removedFromGoogle };
}

/** Delete all events on a given day. Use for "clear my schedule today". */
export async function clearCalendarScheduleForUser(
  userId: string,
  options?: { date?: string; timeZone?: string }
) {
  const timeZone = resolveTimeZone(options?.timeZone);
  const { date, events } = await listCalendarEventsForUser(userId, { ...options, timeZone });

  if (events.length === 0) {
    return { success: true, date, timeZone, deleted: [], alreadyGone: [], failed: [] };
  }

  const deleted: CalendarEventSummary[] = [];
  const alreadyGone: CalendarEventSummary[] = [];
  const failed: Array<{ event: CalendarEventSummary; error: string }> = [];

  for (const event of events) {
    try {
      const result = await deleteCalendarEventForUser(userId, event.id);
      if (result.removedFromGoogle) deleted.push(event);
      else alreadyGone.push(event);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Delete failed';
      failed.push({ event, error: msg });
    }
  }

  sseEmitter.emit(userId, { type: 'calendar:updated' });

  return {
    success: failed.length === 0,
    date,
    timeZone,
    deleted,
    alreadyGone,
    failed,
  };
}

type RawDeleteParams = {
  calendarId?: string;
  id?: string;
  eventId?: string;
};

export async function deleteCalendarEventFromRawParams(userId: string, params: RawDeleteParams) {
  const googleEventId = params.id ?? params.eventId;
  if (!googleEventId) {
    throw new Error('events.delete requires id (Google event id from list_calendar_events)');
  }
  return deleteCalendarEventForUser(userId, googleEventId);
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
