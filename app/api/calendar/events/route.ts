import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { calendarEvents, emailEventLinks, emails } from '@/lib/db/schema';
import { eq, gte, lte, and, asc } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfWindow = new Date();
    endOfWindow.setDate(endOfWindow.getDate() + 7);
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
