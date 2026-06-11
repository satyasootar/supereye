import { NextResponse } from 'next/server';
import { sseEmitter } from '@/lib/sse/emitter';
import { db } from '@/lib/db';
import { syncState } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// This is a generic Corsair webhook receiver.
// In a real app, you would verify the x-corsair-signature header.
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    
    // Corsair usually sends tenant_id as the user identifier
    const userId = payload.tenant_id || payload.userId;
    const provider = payload.plugin || payload.provider; // 'gmail' or 'googlecalendar'
    const action = payload.action;

    if (!userId) {
      return NextResponse.json({ error: 'Missing tenant_id/userId' }, { status: 400 });
    }

    console.log(`[Webhook] Received update for user ${userId} from provider ${provider}`);

    // Inform the client that new data is available so it can re-fetch or sync
    if (provider === 'gmail' || provider?.includes('gmail')) {
      sseEmitter.emit(userId, { type: 'email:updated' });
    } else if (provider === 'googlecalendar' || provider?.includes('calendar')) {
      sseEmitter.emit(userId, { type: 'calendar:updated' });
    } else {
      // Generic update
      sseEmitter.emit(userId, { type: 'sync:requested' });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
