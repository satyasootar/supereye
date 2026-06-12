import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { emails } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { sseEmitter } from '@/lib/sse/emitter';
import { getTenant } from '@/lib/corsair';
import { handleCorsairError } from '@/lib/corsair-error';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const { id: messageId } = await params;

  try {
    const body = await req.json();
    const { replyText, threadId, to, subject } = body;

    const t = getTenant(userId);

    // Fetch the original message to get its RFC 2822 Message-ID
    const originalMsg = await t.gmail.api.messages.get({
      id: messageId,
      format: 'metadata',
      metadataHeaders: ['Message-ID', 'References']
    });

    const headers = originalMsg.payload?.headers || [];
    const rfcMessageId = headers.find(h => h.name?.toLowerCase() === 'message-id')?.value || '';
    const existingReferences = headers.find(h => h.name?.toLowerCase() === 'references')?.value || '';
    
    const newReferences = existingReferences 
      ? `${existingReferences} ${rfcMessageId}`.trim()
      : rfcMessageId;

    // Construct raw email
    const emailLines = [
      `To: ${to}`,
      `Subject: ${subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`}`,
      ...(rfcMessageId ? [`In-Reply-To: ${rfcMessageId}`] : []),
      ...(newReferences ? [`References: ${newReferences}`] : []),
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
  } catch (error: unknown) {
    const result = handleCorsairError(error);
    return NextResponse.json({ error: result.error, code: result.code }, { status: result.status });
  }
}
