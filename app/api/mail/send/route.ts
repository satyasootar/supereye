import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sseEmitter } from '@/lib/sse/emitter';
import { getTenant } from '@/lib/corsair';
import { handleCorsairError } from '@/lib/corsair-error';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await req.json();
    const { to, subject, text } = body;

    if (!to || to.length === 0) {
      return NextResponse.json({ error: 'Recipient is required' }, { status: 400 });
    }

    const t = getTenant(userId);

    const toHeader = Array.isArray(to) ? to.join(', ') : to;

    // Construct raw email
    const emailLines = [
      `To: ${toHeader}`,
      `Subject: ${subject || ''}`,
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      text || ''
    ];

    const raw = Buffer.from(emailLines.join('\n')).toString('base64url');

    await t.gmail.api.messages.send({
      userId: 'me',
      requestBody: {
        raw
      }
    });

    sseEmitter.emit(userId, { type: 'sync:requested' });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const result = handleCorsairError(error);
    return NextResponse.json({ error: result.error, code: result.code }, { status: result.status });
  }
}
