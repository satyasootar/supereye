import { NextResponse } from 'next/server';
import { sseEmitter } from '@/lib/sse/emitter';
import { db } from '@/lib/db';
import { syncState } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { syncGmailForUser } from '@/lib/mail/sync';
import { syncCalendarForUser } from '@/lib/calendar/sync';
import { processWebhook } from 'corsair';
import { corsair } from '@/lib/corsair';

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const queryTenantId = url.searchParams.get('tenantId') || url.searchParams.get('tenant_id');
    
    // Read body as text first for processWebhook, then parse as JSON
    const bodyText = await req.text();
    
    let payload: any = {};
    try {
      payload = bodyText ? JSON.parse(bodyText) : {};
    } catch (e) {
      // Ignore parse error
    }
    
    let userId = queryTenantId || payload.tenant_id || payload.userId;

    // If it's a Gmail Pub/Sub push, we can extract the email address from message.data
    if (!userId && payload.message && payload.message.data) {
      try {
        const decoded = Buffer.from(payload.message.data, 'base64').toString('utf8');
        const data = JSON.parse(decoded);
        if (data.emailAddress) {
          // Look up user by email
          const { db } = await import('@/lib/db');
          const { users } = await import('@/lib/db/schema');
          const { eq } = await import('drizzle-orm');
          const userRecords = await db.select().from(users).where(eq(users.email, data.emailAddress)).limit(1);
          if (userRecords.length > 0) {
            userId = userRecords[0].id;
          }
        }
      } catch (e) {
        console.error('Failed to parse Gmail Pub/Sub data:', e);
      }
    }

    if (!userId) {
      console.error('[Webhook] Missing tenant_id/userId in payload or query params', payload);
      return NextResponse.json({ error: 'Missing tenant_id/userId' }, { status: 400 });
    }

    // Determine provider. Google Calendar sends headers, Gmail Pub/Sub sends payload.subscription
    const isCalendar = req.headers.get('x-goog-resource-uri')?.includes('calendar') || payload.plugin === 'googlecalendar';
    const isGmail = payload.subscription || payload.plugin === 'gmail';
    const provider = payload.plugin || (isCalendar ? 'googlecalendar' : (isGmail ? 'gmail' : 'unknown'));

    console.log(`[Webhook] Received update for user ${userId} from provider ${provider}`);

    // Process webhook via Corsair so internal SDK state is updated
    try {
      const headersObject = Object.fromEntries(req.headers.entries());
      const queryObj = userId ? { tenantId: userId } : undefined;
      await processWebhook(corsair, headersObject, bodyText, queryObj);
    } catch (e) {
      console.warn(`[Webhook] Corsair processWebhook failed (often expected in local dev):`, e);
    }

    // Fetch and sync the latest data in the background for our app DB
    if (provider === 'gmail') {
      // Delay sync by 2.5s to ensure Google's index has propagated label changes
      setTimeout(async () => {
        await syncGmailForUser(userId);
      }, 2500);
    } else if (provider === 'googlecalendar') {
      await syncCalendarForUser(userId, true);
      sseEmitter.emit(userId, { type: 'calendar:updated' });
    } else {
      sseEmitter.emit(userId, { type: 'sync:requested' });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
