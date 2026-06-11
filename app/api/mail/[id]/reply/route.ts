import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { emails } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { sseEmitter } from '@/lib/sse/emitter';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const messageId = params.id;

  try {
    const body = await req.json();
    const { replyText, threadId, to, subject } = body;

    const { corsair } = await import('@/lib/corsair');
    const t = corsair.withTenant(userId) as any;

    // Construct raw email
    const emailLines = [
      `To: ${to}`,
      `Subject: Re: ${subject.replace(/^Re:\s*/i, '')}`,
      `In-Reply-To: ${messageId}`,
      `References: ${messageId}`,
      '',
      replyText
    ];

    const raw = Buffer.from(emailLines.join('\n')).toString('base64url');

    await t.gmail.api.messages.send({
      userId: 'me',
      requestBody: {
        raw,
        threadId
      }
    });

    // We don't necessarily update our local DB immediately with the sent message
    // because the webhook / sync will catch it, but we can emit a sync request.
    sseEmitter.emit(userId, { type: 'sync:requested' });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Reply error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
