import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { calendarEvents, emailEventLinks, emails, syncState } from '@/lib/db/schema';
import { eq, gte, lte, and, asc } from 'drizzle-orm';
import { createGoogleCalendarEvent } from '@/lib/calendar/create-event';
import { sseEmitter } from '@/lib/sse/emitter';

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // Self-healing background sync and watch registration check
  (async () => {
    try {
      const lastSync = await db.select()
        .from(syncState)
        .where(and(eq(syncState.userId, userId), eq(syncState.provider, 'googlecalendar')))
        .limit(1);

      const needsSync = !lastSync.length || !lastSync[0].lastSyncedAt || (Date.now() - lastSync[0].lastSyncedAt.getTime() > 15 * 60 * 1000);
      if (needsSync) {
        console.log(`[Calendar API] Auto-triggering background calendar sync for user ${userId}`);
        const { syncCalendarForUser } = await import('@/lib/calendar/sync');
        syncCalendarForUser(userId).catch(err => 
          console.error('[Calendar API] Auto background sync failed:', err)
        );
      }
    } catch (err) {
      console.error('[Calendar API] Auto background sync check error:', err);
    }
  })();

  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfWindow = new Date();
    endOfWindow.setDate(endOfWindow.getDate() + 35);
    endOfWindow.setHours(23, 59, 59, 999);

    const cachedEvents = await db.select({
      event: calendarEvents,
      emailId: emails.googleMessageId
    })
      .from(calendarEvents)
      .leftJoin(emailEventLinks, eq(calendarEvents.id, emailEventLinks.eventId))
      .leftJoin(emails, eq(emailEventLinks.emailId, emails.id))
      .where(
        and(
          eq(calendarEvents.userId, session.user.id),
          gte(calendarEvents.startTime, startOfDay),
          lte(calendarEvents.startTime, endOfWindow)
        )
      )
      .orderBy(asc(calendarEvents.startTime));

    const safeEvents = cachedEvents.map(row => ({
      id: row.event.googleEventId,
      summary: row.event.title,
      start: {
        dateTime: row.event.startTime?.toISOString(),
        date: row.event.isAllDay ? row.event.startTime?.toISOString().split('T')[0] : undefined
      },
      end: {
        dateTime: row.event.endTime?.toISOString(),
        date: row.event.isAllDay ? row.event.endTime?.toISOString().split('T')[0] : undefined
      },
      location: row.event.location,
      attendees: row.event.attendees || [],
      linkedEmailId: row.emailId,
      colorId: row.event.colorId
    }));

    return NextResponse.json({ events: safeEvents });
  } catch (error: any) {
    console.error('Failed to fetch calendar events from DB:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch calendar events',
      details: error?.message 
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      summary,
      description,
      start,
      end,
      attendees,
      location,
      colorId,
      addGoogleMeet,
    } = body;

    const createdEvent = await createGoogleCalendarEvent(session.user.id, {
      summary,
      description,
      location,
      start,
      end,
      attendees,
      colorId,
      addGoogleMeet: !!addGoogleMeet,
    });

    // Save to local DB cache
    await db.insert(calendarEvents).values({
      userId: session.user.id,
      googleEventId: createdEvent.id!,
      calendarId: 'primary',
      title: createdEvent.summary,
      description: createdEvent.description,
      location: createdEvent.location,
      startTime: createdEvent.start?.dateTime ? new Date(createdEvent.start.dateTime) : (createdEvent.start?.date ? new Date(createdEvent.start.date) : null),
      endTime: createdEvent.end?.dateTime ? new Date(createdEvent.end.dateTime) : (createdEvent.end?.date ? new Date(createdEvent.end.date) : null),
      isAllDay: !!createdEvent.start?.date,
      status: createdEvent.status || 'confirmed',
      attendees: createdEvent.attendees ? createdEvent.attendees.map((a) => ({
        email: a.email,
        displayName: a.displayName,
        responseStatus: a.responseStatus
      })) : null,
      htmlLink: createdEvent.htmlLink,
      colorId: createdEvent.colorId
    });

    sseEmitter.emit(session.user.id, { type: 'calendar:updated' });

    return NextResponse.json({ event: createdEvent });
  } catch (error: any) {
    console.error('Failed to create calendar event:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
