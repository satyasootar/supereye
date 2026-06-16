import { Resend } from 'resend';
import { SITE_NAME } from '@/lib/site/config';

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? `${SITE_NAME} <onboarding@resend.dev>`;
}

export type SendEmailResult = { id: string } | { error: string };

export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendEmailResult> {
  const resend = getResendClient();

  if (!resend) {
    if (process.env.NODE_ENV === 'production') {
      return { error: 'Email service is not configured' };
    }
    console.info('[email:dev]', params.subject, '→', params.to);
    console.info('[email:dev] text body:\n', params.text);
    return { id: 'dev-no-resend' };
  }

  const { data, error } = await resend.emails.send({
    from: getFromAddress(),
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });

  if (error) {
    console.error('[resend]', error);
    return { error: error.message ?? 'Failed to send email' };
  }

  return { id: data?.id ?? 'sent' };
}

export function buildPasswordResetEmail(params: {
  resetUrl: string;
  userName?: string | null;
}) {
  const greeting = params.userName?.trim() ? `Hi ${params.userName.trim()},` : 'Hi,';
  const subject = `Reset your ${SITE_NAME} password`;

  const text = [
    greeting,
    '',
    `We received a request to reset the password for your ${SITE_NAME} account.`,
    'If you made this request, open the link below to choose a new password:',
    '',
    params.resetUrl,
    '',
    'This link expires in 1 hour and can only be used once.',
    'If you did not request a password reset, you can ignore this email.',
    '',
    `— ${SITE_NAME}`,
  ].join('\n');

  const html = `
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#0b0f17;font-family:system-ui,-apple-system,sans-serif;color:#e2e8f0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;background:#111827;border:1px solid #1f2937;border-radius:16px;padding:32px;">
            <tr>
              <td>
                <p style="margin:0 0 16px;font-size:14px;color:#94a3b8;">${greeting}</p>
                <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;color:#f8fafc;">Reset your password</h1>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#cbd5e1;">
                  We received a request to reset the password for your ${SITE_NAME} account.
                  Click the button below to choose a new password.
                </p>
                <a href="${params.resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:10px;">
                  Reset password
                </a>
                <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#94a3b8;">
                  This link expires in <strong>1 hour</strong> and works only once.
                  If you did not request this, you can safely ignore this email.
                </p>
                <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#64748b;word-break:break-all;">
                  Button not working? Copy this URL:<br />
                  <a href="${params.resetUrl}" style="color:#38bdf8;">${params.resetUrl}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

  return { subject, html, text };
}
