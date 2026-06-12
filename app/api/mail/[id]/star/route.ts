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

    const body = await req.json().catch(() => ({}));
    const isStarred = body.isStarred !== false;

    await t.gmail.api.messages.modify({
      userId: 'me',
      id: messageId,
      addLabelIds: isStarred ? ['STARRED'] : [],
      removeLabelIds: !isStarred ? ['STARRED'] : []
    });

    await db.update(emails)
      .set({ isStarred })
      .where(and(eq(emails.userId, userId), eq(emails.googleMessageId, messageId)));

    sseEmitter.emit(userId, { type: 'email:updated' });

    return NextResponse.json({ success: true, isStarred });
  } catch (error: any) {
    console.error('Star error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
