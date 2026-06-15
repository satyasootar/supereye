import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { db } from '@/lib/db';
import { calendarEvents } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getTenant } from '@/lib/corsair';

export async function GET(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  try {
    const { eventId } = await params;
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
    const body = await req.json();
    const t = getTenant(session.user.id);
    const updatedEvent = await t.googlecalendar.api.events.update({
      calendarId: 'primary',
      id: eventId,
      event: body
    });

    // Update local cache
    await db.update(calendarEvents)
      .set({
        title: updatedEvent.summary,
        description: updatedEvent.description,
        location: updatedEvent.location,
        startTime: updatedEvent.start?.dateTime ? new Date(updatedEvent.start.dateTime) : (updatedEvent.start?.date ? new Date(updatedEvent.start.date) : null),
        endTime: updatedEvent.end?.dateTime ? new Date(updatedEvent.end.dateTime) : (updatedEvent.end?.date ? new Date(updatedEvent.end.date) : null),
      })
      .where(and(
        eq(calendarEvents.userId, session.user.id),
        eq(calendarEvents.googleEventId, eventId)
      ));

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
