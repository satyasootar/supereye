import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { emails } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { sseEmitter } from '@/lib/sse/emitter';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { id: messageId } = await params;

  try {
    const { corsair } = await import('@/lib/corsair');
    const t = corsair.withTenant(userId) as any;

    await t.gmail.api.messages.modify({
      userId: 'me',
      id: messageId,
      removeLabelIds: ['INBOX']
    });

    await db.update(emails)
      .set({ isArchived: true })
      .where(and(eq(emails.userId, userId), eq(emails.googleMessageId, messageId)));

    sseEmitter.emit(userId, { type: 'email:updated' });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Archive error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
