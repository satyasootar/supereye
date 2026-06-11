import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { emails, syncState } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { sseEmitter } from '@/lib/sse/emitter';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const { corsair } = await import('@/lib/corsair');
    const t = corsair.withTenant(userId) as any;

    const gmailResult = await t.gmail.api.messages.list({ maxResults: 20 });
    const messageIds = gmailResult.messages || [];

    const toInsert = [];

    for (const msg of messageIds) {
      try {
        const m = await t.gmail.api.messages.get({ id: msg.id, format: 'metadata' });
        const headers = m.payload?.headers || [];
        const subject = headers.find((h: any) => h.name?.toLowerCase() === 'subject')?.value || '';
        const sender = headers.find((h: any) => h.name?.toLowerCase() === 'from')?.value || '';
        
        toInsert.push({
          userId,
          googleMessageId: m.id,
          threadId: m.threadId,
          fromAddress: sender,
          subject,
          snippet: m.snippet,
          internalDate: new Date(parseInt(m.internalDate || '0')),
          isRead: !m.labelIds?.includes('UNREAD'),
          isStarred: m.labelIds?.includes('STARRED'),
          historyId: m.historyId
        });
      } catch (err) {
        console.error('Failed to fetch message', msg.id, err);
      }
    }

    if (toInsert.length > 0) {
      await db.insert(emails).values(toInsert).onConflictDoUpdate({
        target: [emails.userId, emails.googleMessageId],
        set: {
          isRead: sql`excluded.is_read`,
          isStarred: sql`excluded.is_starred`,
          snippet: sql`excluded.snippet`,
        }
      });
      
      sseEmitter.emit(userId, { type: 'email:updated' });
    }

    await db.insert(syncState).values({
      userId,
      provider: 'gmail',
      lastSyncedAt: new Date()
    }).onConflictDoUpdate({
      target: [syncState.userId, syncState.provider],
      set: { lastSyncedAt: new Date() }
    });

    return NextResponse.json({ success: true, count: toInsert.length });
  } catch (error: any) {
    console.error('Mail sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
