import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { calendarEvents, syncState } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { sseEmitter } from '@/lib/sse/emitter';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const { corsair } = await import('@/lib/corsair');
    const t = corsair.withTenant(userId) as any;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfWindow = new Date();
    endOfWindow.setDate(endOfWindow.getDate() + 7);
    endOfWindow.setHours(23, 59, 59, 999);

    const calendarResult = await t.googlecalendar.api.events.getMany({
      calendarId: 'primary',
      timeMin: startOfDay.toISOString(),
      timeMax: endOfWindow.toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime'
    });

    const items = calendarResult.items || [];
    const toInsert = [];

    for (const event of items) {
      const startTime = event.start?.dateTime ? new Date(event.start.dateTime) : (event.start?.date ? new Date(event.start.date) : null);
      const endTime = event.end?.dateTime ? new Date(event.end.dateTime) : (event.end?.date ? new Date(event.end.date) : null);
      
      toInsert.push({
        userId,
        googleEventId: event.id,
        calendarId: 'primary',
        title: event.summary,
        description: event.description,
        location: event.location,
        startTime,
        endTime,
        isAllDay: !!event.start?.date,
        status: event.status || 'confirmed',
        attendees: event.attendees ? event.attendees.map((a: any) => ({
          email: a.email,
          displayName: a.displayName,
          responseStatus: a.responseStatus
        })) : null,
        organizer: event.organizer ? {
          email: event.organizer.email,
          displayName: event.organizer.displayName,
          self: event.organizer.self
        } : null,
        htmlLink: event.htmlLink
      });
    }

    if (toInsert.length > 0) {
      await db.insert(calendarEvents).values(toInsert).onConflictDoUpdate({
        target: [calendarEvents.userId, calendarEvents.googleEventId],
        set: {
          title: sql`excluded.title`,
          description: sql`excluded.description`,
          location: sql`excluded.location`,
          startTime: sql`excluded.start_time`,
          endTime: sql`excluded.end_time`,
          status: sql`excluded.status`,
          attendees: sql`excluded.attendees`,
        }
      });
      
      sseEmitter.emit(userId, { type: 'calendar:updated' });
    }

    await db.insert(syncState).values({
      userId,
      provider: 'googlecalendar',
      lastSyncedAt: new Date()
    }).onConflictDoUpdate({
      target: [syncState.userId, syncState.provider],
      set: { lastSyncedAt: new Date() }
    });

    return NextResponse.json({ success: true, count: toInsert.length });
  } catch (error: any) {
    console.error('Calendar sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
