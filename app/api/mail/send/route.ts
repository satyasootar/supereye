import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sseEmitter } from '@/lib/sse/emitter';
import { getTenant } from '@/lib/corsair';
import { handleCorsairError } from '@/lib/corsair-error';
import MailComposer from 'nodemailer/lib/mail-composer/index.js';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const formData = await req.formData();
    const to = formData.get('to') as string;
    const subject = formData.get('subject') as string;
    const text = formData.get('text') as string;
    const attachmentFiles = formData.getAll('attachments') as File[];

    if (!to || to.length === 0) {
      return NextResponse.json({ error: 'Recipient is required' }, { status: 400 });
    }

    const t = getTenant(userId);

    const attachments = await Promise.all(
      attachmentFiles.map(async (file) => ({
        filename: file.name,
        content: Buffer.from(await file.arrayBuffer()),
        contentType: file.type
      }))
    );

    const mail = new MailComposer({
      to,
      subject: subject || '',
      text: text || '',
      attachments
    });

    const mailBuffer = await mail.compile().build();
    const raw = mailBuffer.toString('base64url');

    await t.gmail.api.messages.send({
      userId: 'me',
      raw
    });

    sseEmitter.emit(userId, { type: 'sync:requested' });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const result = handleCorsairError(error);
    return NextResponse.json({ error: result.error, code: result.code }, { status: result.status });
  }
}
