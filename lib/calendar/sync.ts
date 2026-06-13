import { db } from '@/lib/db';
import { calendarEvents, syncState } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { sseEmitter } from '@/lib/sse/emitter';
import { getTenant } from '@/lib/corsair';

export async function syncCalendarForUser(userId: string) {
  try {
    const t = getTenant(userId);

    // Automatically register/renew the push notification watch
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-localtunnel.loca.lt';
    if (appUrl) {
      try {
        const channelId = `supereye-cal-${userId}`;
        await t.googlecalendar.api.events.watch({
          calendarId: 'primary',
          requestBody: {
            id: channelId,
            type: 'web_hook',
            address: `${appUrl}/api/webhooks/corsair?tenantId=${userId}`,
          }
        });
      } catch (watchErr: any) {
        console.error('Failed to register/renew Calendar watch:', watchErr.message);
      }
    }

    const startOfDay = new Date();
    startOfDay.setDate(1); // Start of current month
    startOfDay.setMonth(startOfDay.getMonth() - 1); // Previous month
    startOfDay.setHours(0, 0, 0, 0);

    const endOfWindow = new Date();
    endOfWindow.setDate(28); // End of next month roughly
    endOfWindow.setMonth(endOfWindow.getMonth() + 2);
    endOfWindow.setHours(23, 59, 59, 999);

    const calendarResult = await t.googlecalendar.api.events.getMany({
      calendarId: 'primary',
      timeMin: startOfDay.toISOString(),
      timeMax: endOfWindow.toISOString(),
      maxResults: 250,
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

    return { success: true, count: toInsert.length };
  } catch (error: any) {
    console.error('Calendar sync logic error:', error);
    throw error;
  }
}
