import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { corsair } from '@/lib/corsair';

export async function POST(req: Request) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

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
    try {
      const { registerCalendarWatch } = await import('@/lib/calendar/sync');
      const watchRes = await registerCalendarWatch(userId);
      if (watchRes) {
        results.calendar = watchRes;
      } else {
        results.calendarError = 'Failed to register calendar watch';
      }
    } catch (e: any) {
      console.error('Failed to register Calendar watch:', e.message);
      results.calendarError = e.message;
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Webhook registration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
