import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { db } from '@/lib/db';
import { emails, scheduledEmails } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { sseEmitter } from '@/lib/sse/emitter';
import { getTenant } from '@/lib/corsair';
import { handleCorsairError } from '@/lib/corsair-error';
import MailComposer from 'nodemailer/lib/mail-composer/index.js';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const userId = session.user.id;
  const { id: messageId } = await params;

  try {
    const formData = await req.formData();
    const replyText = formData.get('replyText') as string;
    const threadId = formData.get('threadId') as string;
    const to = formData.get('to') as string;
    const subject = formData.get('subject') as string;
    const scheduleAt = formData.get('scheduleAt') as string;
    const attachmentFiles = formData.getAll('attachments') as File[];

    const t = getTenant(userId);

    // Fetch the original message to get its RFC 2822 Message-ID
    const originalMsg = await t.gmail.api.messages.get({
      userId: 'me',
      id: messageId,
      format: 'metadata'
    });

    const headers = originalMsg.payload?.headers || [];
    const rfcMessageId = originalMsg.payload?.headers?.find((h: any) => h.name === 'Message-ID')?.value;
    const existingReferences = originalMsg.payload?.headers?.find((h: any) => h.name === 'References')?.value || '';
    
    const newReferences = existingReferences 
      ? `${existingReferences} ${rfcMessageId}`.trim()
      : rfcMessageId;

    const attachments = await Promise.all(
      attachmentFiles.map(async (file) => ({
        filename: file.name,
        content: Buffer.from(await file.arrayBuffer()),
        contentType: file.type
      }))
    );

    const mailOptions: any = {
      to,
      subject: subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`,
      text: replyText,
      attachments
    };

    if (rfcMessageId) mailOptions.inReplyTo = rfcMessageId;
    if (newReferences) mailOptions.references = newReferences;

    const mail = new MailComposer(mailOptions);
    const mailBuffer = await mail.compile().build();
    const raw = mailBuffer.toString('base64url');

    if (scheduleAt) {
      await db.insert(scheduledEmails).values({
        userId,
        rawPayload: raw,
        threadId,
        scheduledAt: new Date(scheduleAt),
        status: 'pending'
      });
      return NextResponse.json({ success: true, scheduled: true });
    }

    await t.gmail.api.messages.send({
      userId: 'me',
      raw,
      threadId
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
