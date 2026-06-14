import { db } from '@/lib/db';
import { calendarEvents } from '@/lib/db/schema';
import { getTenant } from '@/lib/corsair';
import { sseEmitter } from '@/lib/sse/emitter';

export type CreateCalendarEventInput = {
  summary: string;
  startDateTime: string;
  endDateTime: string;
  description?: string;
  location?: string;
  attendees?: string[];
  timeZone?: string;
};

/**
 * Create a Google Calendar event via Corsair using the correct API shape.
 * Corsair expects `event`, NOT Google's raw `resource` parameter.
 */
export async function createCalendarEventForUser(
  userId: string,
  input: CreateCalendarEventInput
) {
  const tenant = getTenant(userId);
  const tz = input.timeZone ?? 'UTC';

  const start = new Date(input.startDateTime);
  const end = new Date(input.endDateTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Invalid start or end date. Use ISO 8601 format.');
  }

  if (end <= start) {
    throw new Error('End time must be after start time.');
  }

  const created = await tenant.googlecalendar.api.events.create({
    calendarId: 'primary',
    event: {
      summary: input.summary,
      description: input.description,
      location: input.location,
      start: {
        dateTime: start.toISOString(),
        timeZone: tz,
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: tz,
      },
      attendees: input.attendees?.map((email) => ({ email })),
    },
  });

  await db
    .insert(calendarEvents)
    .values({
      userId,
      googleEventId: created.id!,
      calendarId: 'primary',
      title: created.summary,
      description: created.description,
      location: created.location,
      startTime: start,
      endTime: end,
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
        startTime: start,
        endTime: end,
        htmlLink: created.htmlLink,
        updatedAt: new Date(),
      },
    });

  sseEmitter.emit(userId, { type: 'calendar:updated' });

  return created;
}
