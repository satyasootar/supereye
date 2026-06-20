import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { db } from '@/lib/db';
import { calendarEvents } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getTenant } from '@/lib/corsair';
import { parseJsonBody } from '@/lib/validation/http';
import { updateCalendarEventSchema } from '@/lib/validation/calendar';
import { googleEventIdSchema } from '@/lib/validation/common';
import { isCalendarEventEditable } from '@/lib/calendar/event-utils';
import { sseEmitter } from '@/lib/sse/emitter';

export async function GET(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  try {
    const { eventId } = await params;
    if (!googleEventIdSchema.safeParse(eventId).success) {
      return NextResponse.json({ error: 'Invalid event id' }, { status: 400 });
    }
    const t = getTenant(session.user.id);
    const event = await t.googlecalendar.api.events.get({
      calendarId: 'primary',
      id: eventId
    });
    return NextResponse.json({ event });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  try {
    const { eventId } = await params;
    if (!googleEventIdSchema.safeParse(eventId).success) {
      return NextResponse.json({ error: 'Invalid event id' }, { status: 400 });
    }

    const parsed = await parseJsonBody(req, updateCalendarEventSchema);
    if ('error' in parsed) return parsed.error;

    const t = getTenant(session.user.id);
    const existingEvent = await t.googlecalendar.api.events.get({
      calendarId: 'primary',
      id: eventId,
    });

    if (!isCalendarEventEditable(existingEvent)) {
      return NextResponse.json(
        { error: 'Past events cannot be edited' },
        { status: 403 }
      );
    }

    const updatedEvent = await t.googlecalendar.api.events.update({
      calendarId: 'primary',
      id: eventId,
      event: {
        ...existingEvent,
        ...parsed.data,
      },
    });

    const resolvedColorId =
      updatedEvent.colorId ?? parsed.data.colorId ?? existingEvent.colorId ?? null;

    // Update local cache
    await db.update(calendarEvents)
      .set({
        title: updatedEvent.summary,
        description: updatedEvent.description,
        location: updatedEvent.location,
        startTime: updatedEvent.start?.dateTime ? new Date(updatedEvent.start.dateTime) : (updatedEvent.start?.date ? new Date(updatedEvent.start.date) : null),
        endTime: updatedEvent.end?.dateTime ? new Date(updatedEvent.end.dateTime) : (updatedEvent.end?.date ? new Date(updatedEvent.end.date) : null),
        colorId: resolvedColorId,
        attendees: updatedEvent.attendees
          ? updatedEvent.attendees
              .filter((a): a is typeof a & { email: string } => typeof a.email === 'string')
              .map((a) => ({
                email: a.email,
                displayName: a.displayName ?? undefined,
                responseStatus: a.responseStatus ?? undefined,
              }))
          : undefined,
      })
      .where(and(
        eq(calendarEvents.userId, session.user.id),
        eq(calendarEvents.googleEventId, eventId)
      ));

    sseEmitter.emit(session.user.id, { type: 'calendar:updated' });

    return NextResponse.json({ event: updatedEvent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  try {
    const { eventId } = await params;
    if (!googleEventIdSchema.safeParse(eventId).success) {
      return NextResponse.json({ error: 'Invalid event id' }, { status: 400 });
    }
    const t = getTenant(session.user.id);
    await t.googlecalendar.api.events.delete({
      calendarId: 'primary',
      id: eventId
    });

    // Delete from local cache
    await db.delete(calendarEvents)
      .where(and(
        eq(calendarEvents.userId, session.user.id),
        eq(calendarEvents.googleEventId, eventId)
      ));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
