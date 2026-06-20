import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { db } from '@/lib/db';
import { scheduledEmails } from '@/lib/db/schema';
import { sseEmitter } from '@/lib/sse/emitter';
import { getTenant } from '@/lib/corsair';
import { handleCorsairError } from '@/lib/corsair-error';
import MailComposer from 'nodemailer/lib/mail-composer/index.js';
import { validateAttachmentFiles } from '@/lib/security/uploads';
import { validationErrorResponse } from '@/lib/validation/http';
import { parseReplyPayload } from '@/lib/validation/mail';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const userId = session.user.id;
  const { id: messageId } = await params;

  try {
    const contentType = req.headers.get('content-type') ?? '';
    const isForm = contentType.includes('multipart/form-data');
    const formData = isForm ? await req.formData() : null;
    const jsonBody = isForm ? null : await req.json();

    const attachmentFiles = formData?.getAll('attachments') as File[] | undefined;
    if (attachmentFiles?.length) {
      const attachmentError = validateAttachmentFiles(attachmentFiles);
      if (attachmentError) {
        return NextResponse.json({ error: attachmentError }, { status: 400 });
      }
    }

    const parsed = parseReplyPayload(req, jsonBody, formData);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const { replyText, html, threadId, to, cc, bcc, subject, scheduleAt } = parsed.data;
    const t = getTenant(userId);

    const originalMsg = await t.gmail.api.messages.get({
      userId: 'me',
      id: messageId,
      format: 'metadata',
    });

    const rfcMessageId = originalMsg.payload?.headers?.find(
      (h: { name?: string; value?: string }) => h.name === 'Message-ID'
    )?.value;
    const existingReferences =
      originalMsg.payload?.headers?.find(
        (h: { name?: string; value?: string }) => h.name === 'References'
      )?.value || '';

    const newReferences = existingReferences
      ? `${existingReferences} ${rfcMessageId}`.trim()
      : rfcMessageId;

    const attachments = await Promise.all(
      (attachmentFiles ?? []).map(async (file) => ({
        filename: file.name,
        content: Buffer.from(await file.arrayBuffer()),
        contentType: file.type,
      }))
    );

    const mailOptions: Record<string, unknown> = {
      to,
      cc: cc || undefined,
      bcc: bcc || undefined,
      subject: subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`,
      text: replyText,
      html: html || undefined,
      attachments,
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
        status: 'pending',
      });
      return NextResponse.json({ success: true, scheduled: true });
    }

    await t.gmail.api.messages.send({
      userId: 'me',
      raw,
      threadId,
    });

    sseEmitter.emit(userId, { type: 'sync:requested' });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const result = handleCorsairError(error);
    return NextResponse.json({ error: result.error, code: result.code }, { status: result.status });
  }
}
