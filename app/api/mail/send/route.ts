import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { sseEmitter } from '@/lib/sse/emitter';
import { getTenant } from '@/lib/corsair';
import { handleCorsairError } from '@/lib/corsair-error';
import MailComposer from 'nodemailer/lib/mail-composer/index.js';
import { db } from '@/lib/db';
import { scheduledEmails } from '@/lib/db/schema';
import { validateAttachmentFiles } from '@/lib/security/uploads';
import { validationErrorResponse } from '@/lib/validation/http';
import { mailSendFieldsSchema, parseMailFormFields } from '@/lib/validation/mail';

export async function POST(req: Request) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const userId = session.user.id;

  try {
    const formData = await req.formData();
    const attachmentFiles = formData.getAll('attachments') as File[];
    const attachmentError = validateAttachmentFiles(attachmentFiles);
    if (attachmentError) {
      return NextResponse.json({ error: attachmentError }, { status: 400 });
    }

    const parsed = parseMailFormFields(formData, mailSendFieldsSchema);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const { to, subject, text, scheduleAt, isDraft } = parsed.data;
    const t = getTenant(userId);

    const attachments = await Promise.all(
      attachmentFiles.map(async (file) => ({
        filename: file.name,
        content: Buffer.from(await file.arrayBuffer()),
        contentType: file.type,
      }))
    );

    const mail = new MailComposer({
      to,
      subject,
      text,
      attachments,
    });

    const mailBuffer = await mail.compile().build();
    const raw = mailBuffer.toString('base64url');

    if (scheduleAt) {
      await db.insert(scheduledEmails).values({
        userId,
        rawPayload: raw,
        scheduledAt: new Date(scheduleAt),
        status: 'pending',
      });
      return NextResponse.json({ success: true, scheduled: true });
    }

    if (isDraft) {
      await t.gmail.api.drafts.create({
        message: { raw },
      });
      sseEmitter.emit(userId, { type: 'sync:requested' });
      return NextResponse.json({ success: true, draft: true });
    }

    await t.gmail.api.messages.send({
      userId: 'me',
      raw,
    });

    sseEmitter.emit(userId, { type: 'sync:requested' });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const result = handleCorsairError(error);
    return NextResponse.json({ error: result.error, code: result.code }, { status: result.status });
  }
}
