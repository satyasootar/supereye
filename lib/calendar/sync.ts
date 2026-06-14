import { db } from '@/lib/db';
import { calendarEvents, syncState } from '@/lib/db/schema';
import { sql, and, eq, inArray, notInArray, gte, lte } from 'drizzle-orm';
import { sseEmitter } from '@/lib/sse/emitter';
import { getTenant, corsair } from '@/lib/corsair';
import { extractMeetLink, resolveEventLocation } from '@/lib/calendar/meet';

export async function registerCalendarWatch(userId: string) {
  try {
    const t = getTenant(userId) as any;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      console.warn('[Calendar Watch] NEXT_PUBLIC_APP_URL is not configured, skipping watch registration.');
      return null;
    }

    const getClientId = corsair.keys.googlecalendar.get_client_id;
    const getClientSecret = corsair.keys.googlecalendar.get_client_secret;
    const getRefreshToken = t.googlecalendar.keys.get_refresh_token;

    const [clientId, clientSecret, refreshToken] = await Promise.all([
      getClientId(),
      getClientSecret(),
      getRefreshToken(),
    ]);

    if (!clientId || !clientSecret || !refreshToken) {
      console.warn('[Calendar Watch] Missing Google credentials, skipping watch registration.');
      return null;
    }

    // Refresh access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('[Calendar Watch] Token refresh failed:', err);
      return null;
    }

    const { access_token } = (await tokenRes.json()) as { access_token: string };
    const channelId = `supereye-cal-${userId}`;
    const webhookUrl = `${appUrl}/api/webhooks/corsair?tenantId=${userId}`;

    const watchRes = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events/watch',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + access_token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: channelId,
          type: 'web_hook',
          address: webhookUrl,
        }),
      }
    );

    if (!watchRes.ok) {
      const err = await watchRes.text();
      console.error('[Calendar Watch] Calendar watch failed:', err);
      return null;
    }

    const data = (await watchRes.json()) as {
      id: string;
      resourceId: string;
      expiration: string;
    };

    console.log(`[Calendar Watch] Watch successfully registered. Expiration: ${new Date(Number(data.expiration)).toISOString()}`);
    return data;
  } catch (error: any) {
    console.error('[Calendar Watch] Failed to register calendar watch:', error.message);
    return null;
  }
}

export async function syncCalendarForUser(userId: string, isWebhook: boolean = false) {
  try {
    const t = getTenant(userId) as any;

    // Automatically register/renew the push notification watch if not called from a webhook callback
    if (!isWebhook) {
      await registerCalendarWatch(userId);
    }

    const startOfDay = new Date();
    startOfDay.setDate(1); // Start of current month
    startOfDay.setMonth(startOfDay.getMonth() - 1); // Previous month
    startOfDay.setHours(0, 0, 0, 0);

    const endOfWindow = new Date();
    endOfWindow.setDate(28); // End of next month roughly
    endOfWindow.setMonth(endOfWindow.getMonth() + 2);
    endOfWindow.setHours(23, 59, 59, 999);

    const getClientId = corsair.keys.googlecalendar.get_client_id;
    const getClientSecret = corsair.keys.googlecalendar.get_client_secret;
    const getRefreshToken = t.googlecalendar.keys.get_refresh_token;

    const [clientId, clientSecret, refreshToken] = await Promise.all([
      getClientId(),
      getClientSecret(),
      getRefreshToken(),
    ]);

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('Missing Google credentials for sync');
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenRes.ok) throw new Error('Failed to refresh token');
    const { access_token } = await tokenRes.json();

    const params = new URLSearchParams({
      timeMin: startOfDay.toISOString(),
      timeMax: endOfWindow.toISOString(),
      maxResults: '250',
      singleEvents: 'true',
      orderBy: 'startTime',
      showDeleted: 'true'
    });

    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch events from Google API: ${await res.text()}`);
    }

    const calendarResult = await res.json();

    const items = calendarResult.items || [];
    const toInsert = [];
    const toDeleteIds: string[] = [];

    for (const event of items) {
      if (event.status === 'cancelled') {
        if (event.id) {
          toDeleteIds.push(event.id);
        }
        continue;
      }

      const startTime = event.start?.dateTime ? new Date(event.start.dateTime) : (event.start?.date ? new Date(event.start.date) : null);
      const endTime = event.end?.dateTime ? new Date(event.end.dateTime) : (event.end?.date ? new Date(event.end.date) : null);
      
      const meetLink = extractMeetLink(event);
      const location = resolveEventLocation(event.location, meetLink);

      toInsert.push({
        userId,
        googleEventId: event.id,
        calendarId: 'primary',
        title: event.summary,
        description: event.description,
        location,
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
        htmlLink: event.htmlLink,
        colorId: event.colorId
      });
    }

    // 1. Delete events that are explicitly marked as cancelled
    if (toDeleteIds.length > 0) {
      await db.delete(calendarEvents)
        .where(
          and(
            eq(calendarEvents.userId, userId),
            inArray(calendarEvents.googleEventId, toDeleteIds)
          )
        );
    }

    // 2. Insert/Update active events
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
          colorId: sql`excluded.color_id`,
        }
      });
    }

    // 3. Fallback window-based deletion for any other stale events in the synced window
    const fetchedActiveGoogleIds = toInsert.map(item => item.googleEventId).filter(Boolean) as string[];
    if (fetchedActiveGoogleIds.length > 0) {
      await db.delete(calendarEvents)
        .where(
          and(
            eq(calendarEvents.userId, userId),
            gte(calendarEvents.startTime, startOfDay),
            lte(calendarEvents.startTime, endOfWindow),
            notInArray(calendarEvents.googleEventId, fetchedActiveGoogleIds)
          )
        );
    } else {
      await db.delete(calendarEvents)
        .where(
          and(
            eq(calendarEvents.userId, userId),
            gte(calendarEvents.startTime, startOfDay),
            lte(calendarEvents.startTime, endOfWindow)
          )
        );
    }

    // Always emit update signal
    sseEmitter.emit(userId, { type: 'calendar:updated' });

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
