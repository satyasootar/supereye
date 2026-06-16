import { NextResponse } from 'next/server';
import { sseEmitter } from '@/lib/sse/emitter';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { syncGmailForUser } from '@/lib/mail/sync';
import { syncCalendarForUser } from '@/lib/calendar/sync';
import { processWebhook } from 'corsair';
import { corsair } from '@/lib/corsair';
import {
  extractCalendarUserId,
  isCalendarWebhook,
  isGmailPubSubPayload,
  verifyWebhookToken,
} from '@/lib/security/webhooks';

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    
    let payload: Record<string, unknown> = {};
    try {
      payload = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    let userId: string | null = null;
    let provider: string | null = null;

    if (isCalendarWebhook(req)) {
      const channelId = req.headers.get('x-goog-channel-id');
      userId = extractCalendarUserId(channelId);
      if (!userId) {
        return NextResponse.json({ error: 'Invalid calendar channel' }, { status: 400 });
      }

      const channelToken = req.headers.get('x-goog-channel-token');
      if (!verifyWebhookToken(userId, channelToken)) {
        return NextResponse.json({ error: 'Invalid webhook token' }, { status: 401 });
      }

      provider = 'googlecalendar';
    } else if (isGmailPubSubPayload(payload)) {
      const expectedSubscription = process.env.GMAIL_PUBSUB_SUBSCRIPTION;
      const subscription = typeof payload.subscription === 'string' ? payload.subscription : '';
      if (expectedSubscription && subscription !== expectedSubscription) {
        return NextResponse.json({ error: 'Invalid subscription' }, { status: 403 });
      }

      try {
        const message = payload.message as { data: string };
        const decoded = Buffer.from(message.data, 'base64').toString('utf8');
        const data = JSON.parse(decoded) as { emailAddress?: string };
        if (data.emailAddress) {
          const normalizedEmail = data.emailAddress.trim().toLowerCase();
          const userRecords = await db
            .select({ id: users.id })
            .from(users)
            .where(sql`lower(${users.email}) = ${normalizedEmail}`)
            .limit(1);
          if (userRecords.length > 0) {
            userId = userRecords[0].id;
          }
        }
      } catch (e) {
        console.error('Failed to parse Gmail Pub/Sub data:', e);
      }

      provider = 'gmail';
    } else {
      return NextResponse.json({ error: 'Unrecognized webhook source' }, { status: 403 });
    }

    if (!userId) {
      console.error('[Webhook] Could not resolve user from verified webhook payload');
      return NextResponse.json({ error: 'User not found' }, { status: 400 });
    }

    console.log(`[Webhook] Received update for user ${userId} from provider ${provider}`);

    // Corsair's Gmail webhook handler calls the API with the email address as
    // userId (404). We sync via syncGmailForUser which uses userId: 'me'.
    if (provider !== 'gmail') {
      try {
        const headersObject = Object.fromEntries(req.headers.entries());
        const queryObj = { tenantId: userId };
        const safeBodyText = bodyText ? bodyText : '{}';
        await processWebhook(corsair, headersObject, safeBodyText, queryObj);
      } catch (e) {
        console.warn(`[Webhook] Corsair processWebhook failed:`, e);
      }
    }

    if (provider === 'gmail') {
      setTimeout(async () => {
        await syncGmailForUser(userId!);
      }, 2500);
    } else if (provider === 'googlecalendar') {
      await syncCalendarForUser(userId, true);
      sseEmitter.emit(userId, { type: 'calendar:updated' });
    } else {
      sseEmitter.emit(userId, { type: 'sync:requested' });
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('Webhook processing error:', error);
    const message = error instanceof Error ? error.message : 'Webhook processing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
