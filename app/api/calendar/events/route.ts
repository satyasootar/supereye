import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { calendarEvents, emailEventLinks, emails } from '@/lib/db/schema';
import { eq, gte, lte, and, asc } from 'drizzle-orm';
import { getTenant } from '@/lib/corsair';

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
      linkedEmailId: row.emailId
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
    const { summary, description, start, end, attendees, location } = body;

    const t = getTenant(session.user.id);
    const createdEvent = await t.googlecalendar.api.events.create({
      calendarId: 'primary',
      requestBody: {
        summary,
        description,
        location,
        start,
        end,
        attendees,
      }
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
      attendees: createdEvent.attendees ? createdEvent.attendees.map((a: any) => ({
        email: a.email,
        displayName: a.displayName,
        responseStatus: a.responseStatus
      })) : null,
      htmlLink: createdEvent.htmlLink
    });

    return NextResponse.json({ event: createdEvent });
  } catch (error: any) {
    console.error('Failed to create calendar event:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
