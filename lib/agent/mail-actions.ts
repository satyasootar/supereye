import MailComposer from 'nodemailer/lib/mail-composer/index.js';
import { getTenant } from '@/lib/corsair';
import { sseEmitter } from '@/lib/sse/emitter';
import { logAndConsumeAiUsage } from '@/lib/billing/usage';

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  body: string;
};

function isCorsairError(value: unknown): value is { error: string } {
  return (
    !!value &&
    typeof value === 'object' &&
    'error' in value &&
    typeof (value as { error: unknown }).error === 'string'
  );
}

/**
 * Fix common partial addresses like "name@gmail" → "name@gmail.com".
 * Does not alter the local part — only completes obvious domains.
 */
export function normalizeEmailAddress(email: string): string {
  const trimmed = email.trim().toLowerCase();

  if (!trimmed) {
    throw new Error('Recipient email is required');
  }

  if (!trimmed.includes('@')) {
    throw new Error(`Invalid email "${email}". Include a full address like name@gmail.com`);
  }

  if (/@gmail$/i.test(trimmed)) return `${trimmed}.com`;
  if (/@googlemail$/i.test(trimmed)) return `${trimmed}.com`;
  if (/@outlook$/i.test(trimmed)) return `${trimmed}.com`;
  if (/@hotmail$/i.test(trimmed)) return `${trimmed}.com`;

  const basic = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!basic.test(trimmed)) {
    throw new Error(`Invalid email "${email}"`);
  }

  return trimmed;
}

export function normalizeRecipients(to: string | string[]): string[] {
  const list = Array.isArray(to) ? to : [to];
  if (list.length === 0) throw new Error('At least one recipient is required');
  return list.map(normalizeEmailAddress);
}

async function buildRawMessage(input: SendEmailInput): Promise<string> {
  const recipients = normalizeRecipients(input.to);

  const mail = new MailComposer({
    to: recipients.join(', '),
    subject: input.subject,
    text: input.body,
  });

  const mailBuffer = await mail.compile().build();
  return mailBuffer.toString('base64url');
}

type RawSendParams = {
  userId?: string;
  raw?: string;
  to?: string | string[];
  subject?: string;
  body?: string;
  text?: string;
  message?: { raw?: string };
};

/**
 * Send email via Corsair Gmail using the same raw MIME format as the UI composer.
 */
export async function sendEmailForUser(userId: string, input: SendEmailInput) {
  const tenant = getTenant(userId);
  const raw = await buildRawMessage(input);

  const result = await tenant.gmail.api.messages.send({
    userId: 'me',
    raw,
  });

  if (isCorsairError(result)) {
    throw new Error(`Email send failed: ${result.error}`);
  }

  sseEmitter.emit(userId, { type: 'sync:requested' });

  void logAndConsumeAiUsage(userId, {
    feature: 'agent_email_send',
    metadata: {
      subject: input.subject,
      recipientCount: normalizeRecipients(input.to).length,
    },
  });

  return {
    success: true,
    to: normalizeRecipients(input.to),
    subject: input.subject,
    messageId: typeof result === 'object' && result && 'id' in result ? result.id : undefined,
  };
}

export async function sendEmailFromRawParams(userId: string, params: RawSendParams) {
  if (params.raw) {
    const tenant = getTenant(userId);
    const result = await tenant.gmail.api.messages.send({
      userId: params.userId ?? 'me',
      raw: params.raw,
    });
    if (isCorsairError(result)) {
      throw new Error(`Email send failed: ${result.error}`);
    }
    sseEmitter.emit(userId, { type: 'sync:requested' });
    return result;
  }

  if (params.message?.raw) {
    return sendEmailFromRawParams(userId, { userId: params.userId, raw: params.message.raw });
  }

  const to = params.to;
  const subject = params.subject;
  const body = params.body ?? params.text;

  if (!to || !subject || !body) {
    throw new Error('Email send requires to, subject, and body (or raw MIME).');
  }

  return sendEmailForUser(userId, { to, subject, body });
}
