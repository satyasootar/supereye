import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scheduledEmails } from '@/lib/db/schema';
import { lte, eq, and } from 'drizzle-orm';
import { getTenant } from '@/lib/corsair';

// For Vercel Cron or VPS cron jobs. We do not require auth, but you might want to add a secret token.
export async function GET(req: Request) {
  try {
    // 1. Fetch pending scheduled emails where scheduledAt <= now
    const pendingEmails = await db
      .select()
      .from(scheduledEmails)
      .where(
        and(
          eq(scheduledEmails.status, 'pending'),
          lte(scheduledEmails.scheduledAt, new Date())
        )
      );

    if (pendingEmails.length === 0) {
      return NextResponse.json({ success: true, processed: 0 });
    }

    let processedCount = 0;

    // 2. Process each email
    for (const email of pendingEmails) {
      try {
        const t = getTenant(email.userId);
        
        await t.gmail.api.messages.send({
          userId: 'me',
          raw: email.rawPayload,
          ...(email.threadId ? { threadId: email.threadId } : {})
        });

        // Update status to 'sent'
        await db
          .update(scheduledEmails)
          .set({ status: 'sent', updatedAt: new Date() })
          .where(eq(scheduledEmails.id, email.id));

        processedCount++;
      } catch (err) {
        console.error(`Failed to process scheduled email ${email.id}:`, err);
        // Mark as failed so we don't keep retrying it infinitely if it's a hard error
        await db
          .update(scheduledEmails)
          .set({ status: 'failed', updatedAt: new Date() })
          .where(eq(scheduledEmails.id, email.id));
      }
    }

    return NextResponse.json({ success: true, processed: processedCount });
  } catch (error) {
    console.error('Failed to run scheduled emails cron:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
