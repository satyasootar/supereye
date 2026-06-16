import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { db } from '@/lib/db';
import { emails } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { sseEmitter } from '@/lib/sse/emitter';
import { parseJsonBody, validationErrorResponse } from '@/lib/validation/http';
import { mailStarSchema } from '@/lib/validation/mail';
import { googleMessageIdSchema } from '@/lib/validation/common';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const userId = session.user.id;
  const { id: messageId } = await params;
  if (!googleMessageIdSchema.safeParse(messageId).success) {
    return NextResponse.json({ error: 'Invalid message id' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const starParsed = mailStarSchema.safeParse(body);
  if (!starParsed.success) {
    return validationErrorResponse(starParsed.error);
  }
  const isStarred = starParsed.data.isStarred;

  try {
    const { corsair } = await import('@/lib/corsair');
    const t = corsair.withTenant(userId) as any;

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
