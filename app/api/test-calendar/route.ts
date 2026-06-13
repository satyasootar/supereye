import { NextResponse } from 'next/server';
import { getTenant } from '@/lib/corsair';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

export async function GET() {
  try {
    const allUsers = await db.select().from(users);
    if (!allUsers.length) {
      return NextResponse.json({ error: 'No users found' }, { status: 400 });
    }
    const userId = allUsers[0].id;
    const t = getTenant(userId);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfWindow = new Date();
    endOfWindow.setDate(endOfWindow.getDate() + 7);

    // Test getMany
    const calendarResult = await t.googlecalendar.api.events.getMany({
      calendarId: 'primary',
      timeMin: startOfDay.toISOString(),
      timeMax: endOfWindow.toISOString(),
      maxResults: 5,
      singleEvents: true,
      orderBy: 'startTime'
    });

    // Test watch (Webhooks)
    let watchResult = null;
    let watchError = null;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-localtunnel.loca.lt';
    if (appUrl) {
      try {
        const channelId = `test-watch-${userId}-${Date.now()}`;
        watchResult = await t.googlecalendar.api.events.watch({
          calendarId: 'primary',
          requestBody: {
            id: channelId,
            type: 'web_hook',
            address: `${appUrl}/api/webhooks/corsair?tenantId=${userId}`,
          }
        });
      } catch (e: any) {
        watchError = e.message;
      }
    }

    return NextResponse.json({ 
      success: true, 
      eventsFetched: calendarResult.items?.length || 0,
      watchResult,
      watchError
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
