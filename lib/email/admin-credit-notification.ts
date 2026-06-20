import { sendTransactionalEmail } from '@/lib/email/resend';
import { SITE_NAME } from '@/lib/site/config';
import { formatCreditsExact } from '@/lib/billing/format';

export async function sendAdminCreditAddedEmail(params: {
  to: string;
  userName?: string | null;
  creditedAmount: number;
  adminName?: string | null;
}) {
  const greeting = params.userName?.trim() ? `Hi ${params.userName.trim()},` : 'Hi,';
  const amountLabel = formatCreditsExact(params.creditedAmount);
  const byLine = params.adminName?.trim() ? ` by ${params.adminName.trim()}` : '';
  const subject = `${amountLabel} credits added to your ${SITE_NAME} account`;

  const text = [
    greeting,
    '',
    `${amountLabel} AI credits have been credited to your account${byLine}.`,
    '',
    'Thank you for using Supereye.',
    '',
    `— ${SITE_NAME} Team`,
  ].join('\n');

  const html = `
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#0b0f17;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#e2e8f0;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:28px 14px;background:#0b0f17;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;border:1px solid #1f2937;border-radius:18px;background:linear-gradient(180deg,#111827 0%,#0f172a 100%);overflow:hidden;">
            <tr>
              <td style="padding:22px 28px;border-bottom:1px solid #1f2937;background:radial-gradient(circle at top right,rgba(59,130,246,.12),transparent 58%);">
                <p style="margin:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;">${SITE_NAME}</p>
                <h1 style="margin:8px 0 0;font-size:24px;line-height:1.2;font-weight:700;color:#f8fafc;">Credits Added To Your Account</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;">
                <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#cbd5e1;">${greeting}</p>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#cbd5e1;">
                  Great news - your account has been topped up${byLine}.
                </p>

                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 20px;">
                  <tr>
                    <td style="border:1px solid rgba(59,130,246,.35);border-radius:14px;background:rgba(15,23,42,.8);padding:16px 18px;">
                      <p style="margin:0 0 6px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#93c5fd;">Credited amount</p>
                      <p style="margin:0;font-size:28px;line-height:1.2;font-weight:700;color:#ffffff;">${amountLabel} AI credits</p>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#94a3b8;">
                  Thank you for using Supereye.
                </p>
                <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">- ${SITE_NAME} Team</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

  return sendTransactionalEmail({ to: params.to, subject, html, text });
}
