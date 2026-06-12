import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { corsair } from '@/lib/corsair';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const t = corsair.withTenant(userId) as any;

  try {
    const results: any = {};

    // 1. Register Gmail Webhook
    const topicName = process.env.GMAIL_PUBSUB_TOPIC;
    if (topicName) {
      try {
        const watchRes = await t.gmail.api.users.watch({
          userId: 'me',
          requestBody: {
            topicName,
            labelIds: ['INBOX']
          }
        });
        results.gmail = watchRes;
      } catch (e: any) {
        console.error('Failed to register Gmail watch:', e.message);
        results.gmailError = e.message;
      }
    } else {
      results.gmailError = 'GMAIL_PUBSUB_TOPIC env var not set';
    }

    // 2. Register Calendar Webhook
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-localtunnel.loca.lt';
    if (appUrl) {
      try {
        // We use a unique channel ID per user so we can identify them, 
        // though Corsair processWebhook uses the query param ?tenantId=...
        const channelId = `supereye-cal-${userId}-${Date.now()}`;
        const watchRes = await t.googlecalendar.api.events.watch({
          calendarId: 'primary',
          requestBody: {
            id: channelId,
            type: 'web_hook',
            address: `${appUrl}/api/webhooks/corsair?tenantId=${userId}`,
            // Optional: TTL can be set, otherwise default is 30 days
          }
        });
        results.calendar = watchRes;
      } catch (e: any) {
        console.error('Failed to register Calendar watch:', e.message);
        results.calendarError = e.message;
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Webhook registration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
