import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { calendarEvents } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getTenant } from '@/lib/corsair';

export async function GET(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { eventId } = await params;
    const t = getTenant(session.user.id);
    const event = await t.googlecalendar.api.events.get({
      calendarId: 'primary',
      eventId: eventId
    });
    return NextResponse.json({ event });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { eventId } = await params;
    const body = await req.json();
    const t = getTenant(session.user.id);
    const updatedEvent = await t.googlecalendar.api.events.update({
      calendarId: 'primary',
      eventId: eventId,
      requestBody: body
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
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { eventId } = await params;
    const t = getTenant(session.user.id);
    await t.googlecalendar.api.events.delete({
      calendarId: 'primary',
      eventId: eventId
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
