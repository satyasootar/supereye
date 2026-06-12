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
    
    const userId = queryTenantId || payload.tenant_id || payload.userId;

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
    const headersObject = Object.fromEntries(req.headers.entries());
    const queryObj = userId ? { tenantId: userId } : undefined;
    await processWebhook(corsair, headersObject, bodyText, queryObj);

    // Fetch and sync the latest data in the background for our app DB
    if (provider === 'gmail') {
      await syncGmailForUser(userId);
    } else if (provider === 'googlecalendar') {
      await syncCalendarForUser(userId);
    } else {
      sseEmitter.emit(userId, { type: 'sync:requested' });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
