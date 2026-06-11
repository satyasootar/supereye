import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { calendarEvents } from '@/lib/db/schema';
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

    const cachedEvents = await db.select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.userId, session.user.id),
          gte(calendarEvents.startTime, startOfDay),
          lte(calendarEvents.startTime, endOfWindow)
        )
      )
      .orderBy(asc(calendarEvents.startTime));

    const safeEvents = cachedEvents.map(event => ({
      id: event.googleEventId,
      summary: event.title,
      start: {
        dateTime: event.startTime?.toISOString(),
        date: event.isAllDay ? event.startTime?.toISOString().split('T')[0] : undefined
      },
      end: {
        dateTime: event.endTime?.toISOString(),
        date: event.isAllDay ? event.endTime?.toISOString().split('T')[0] : undefined
      },
      location: event.location,
      attendees: event.attendees || []
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
