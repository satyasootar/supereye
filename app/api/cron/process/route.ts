import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scheduledEmails } from '@/lib/db/schema';
import { lte, eq, and } from 'drizzle-orm';
import { getTenant } from '@/lib/corsair';
import { verifyCronSecret } from '@/lib/security/api-auth';

export async function GET(req: Request) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
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

    for (const email of pendingEmails) {
      try {
        const t = getTenant(email.userId);
        
        await t.gmail.api.messages.send({
          userId: 'me',
          raw: email.rawPayload,
          ...(email.threadId ? { threadId: email.threadId } : {})
        });

        await db
          .update(scheduledEmails)
          .set({ status: 'sent', updatedAt: new Date() })
          .where(eq(scheduledEmails.id, email.id));

        processedCount++;
      } catch (err) {
        console.error(`Failed to process scheduled email ${email.id}:`, err);
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
