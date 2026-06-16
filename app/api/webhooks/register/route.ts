import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { registerGmailWatch } from '@/lib/mail/watch';
import { registerCalendarWatch } from '@/lib/calendar/sync';

export async function POST(req: Request) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const userId = session.user.id;

  try {
    const results: Record<string, unknown> = {};

    const gmailWatch = await registerGmailWatch(userId);
    if (gmailWatch) {
      results.gmail = gmailWatch;
    } else if (!process.env.GMAIL_PUBSUB_TOPIC) {
      results.gmailError = 'GMAIL_PUBSUB_TOPIC env var not set';
    } else {
      results.gmailError = 'Failed to register Gmail watch';
    }

    const calendarWatch = await registerCalendarWatch(userId);
    if (calendarWatch) {
      results.calendar = calendarWatch;
    } else {
      results.calendarError = 'Failed to register calendar watch';
    }

    return NextResponse.json({ success: true, results });
  } catch (error: unknown) {
    console.error('Webhook registration error:', error);
    const message = error instanceof Error ? error.message : 'Registration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
