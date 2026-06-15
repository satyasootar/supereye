import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { db } from '@/lib/db';
import { emails } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { sseEmitter } from '@/lib/sse/emitter';
import { getTenant } from '@/lib/corsair';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const userId = session.user.id;
  const { id: messageId } = await params;

  try {
    const t = getTenant(userId);

    await t.gmail.api.messages.modify({
      userId: 'me',
      id: messageId,
      removeLabelIds: ['UNREAD']
    });

    await db.update(emails)
      .set({ isRead: true })
      .where(and(eq(emails.userId, userId), eq(emails.googleMessageId, messageId)));

    sseEmitter.emit(userId, { type: 'email:updated' });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Mark read error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
