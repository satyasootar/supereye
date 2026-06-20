import { sendTransactionalEmail } from '@/lib/email/resend';
import { SITE_NAME } from '@/lib/site/config';
import { formatCredits } from '@/lib/billing/format';
import type { BillingRequestType } from '@/lib/db/schema';

export async function sendBillingRequestEmail(params: {
  to: string;
  userName?: string | null;
  outcome: 'approved' | 'rejected';
  requestType: BillingRequestType;
  packName?: string;
  tokenAmount?: number;
  planName?: string;
  adminNote?: string;
}) {
  const greeting = params.userName?.trim() ? `Hi ${params.userName.trim()},` : 'Hi,';
  const isCredit = params.requestType === 'credit_top_up';
  const approved = params.outcome === 'approved';

  const subject = approved
    ? isCredit
      ? `Your ${SITE_NAME} credit request was approved`
      : `Your ${SITE_NAME} plan change was approved`
    : isCredit
      ? `Your ${SITE_NAME} credit request was declined`
      : `Your ${SITE_NAME} plan change request was declined`;

  const summary = approved
    ? isCredit
      ? `Your request for ${params.packName ?? 'credits'}${params.tokenAmount ? ` (${formatCredits(params.tokenAmount)} credits)` : ''} has been approved. Credits have been added to your account.`
      : `Your subscription has been updated to the ${params.planName ?? 'requested'} plan.`
    : isCredit
      ? `Your request for ${params.packName ?? 'additional credits'} was not approved at this time.`
      : `Your request to change to the ${params.planName ?? 'requested'} plan was not approved at this time.`;

  const noteLine = params.adminNote?.trim()
    ? `\n\nAdmin note: ${params.adminNote.trim()}`
    : '';

  const text = [greeting, '', summary + noteLine, '', `— ${SITE_NAME} Team`].join('\n');

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
                <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;color:#f8fafc;">
                  ${approved ? 'Request approved' : 'Request declined'}
                </h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#cbd5e1;">
                  ${summary}
                </p>
                ${
                  params.adminNote?.trim()
                    ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#94a3b8;"><strong>Admin note:</strong> ${params.adminNote.trim()}</p>`
                    : ''
                }
                <p style="margin:0;font-size:13px;color:#64748b;">— ${SITE_NAME} Team</p>
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
