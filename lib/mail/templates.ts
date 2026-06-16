export type PredefinedTemplate = {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  category: 'newsletter' | 'promotion' | 'announcement' | 'welcome';
};

export const PREDEFINED_EMAIL_TEMPLATES: PredefinedTemplate[] = [
  {
    id: 'pre-newsletter',
    name: 'Newsletter Digest',
    subject: 'Your weekly digest is here',
    category: 'newsletter',
    htmlContent: `<!doctype html><html><body style="margin:0;padding:0;background:#f4f7fb;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:24px 0;">
  <tr><td align="center">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:14px;overflow:hidden;font-family:Arial,sans-serif;">
      <tr><td style="padding:28px;background:#0f172a;color:#e2e8f0;">
        <h1 style="margin:0;font-size:24px;line-height:1.3;">Weekly Updates</h1>
        <p style="margin:8px 0 0;font-size:14px;opacity:.9;">Top stories, launches, and insights from this week.</p>
      </td></tr>
      <tr><td style="padding:24px;">
        <img src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80" alt="Team" style="width:100%;height:auto;border-radius:10px;display:block;" />
        <h2 style="font-size:20px;margin:20px 0 8px;color:#0f172a;">Inside this issue</h2>
        <ul style="margin:0;padding-left:20px;color:#334155;line-height:1.6;">
          <li>Product improvements and roadmap notes</li>
          <li>Customer success stories</li>
          <li>Upcoming events and announcements</li>
        </ul>
        <p style="margin:18px 0 0;color:#475569;line-height:1.6;">Thanks for reading. Reply to this email with what you want us to cover next.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`,
  },
  {
    id: 'pre-promo',
    name: 'Promotional Offer',
    subject: 'Limited-time offer: 30% off this week',
    category: 'promotion',
    htmlContent: `<!doctype html><html><body style="margin:0;padding:0;background:#fff7ed;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 0;background:#fff7ed;">
  <tr><td align="center">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:14px;font-family:Arial,sans-serif;">
      <tr><td style="padding:26px;text-align:center;background:linear-gradient(120deg,#f97316,#ef4444);color:#fff;">
        <p style="margin:0;font-size:13px;letter-spacing:.08em;text-transform:uppercase;">Special Promotion</p>
        <h1 style="margin:10px 0 0;font-size:30px;">Save 30% Today</h1>
      </td></tr>
      <tr><td style="padding:24px;color:#374151;">
        <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Upgrade now and get full access to premium features at a discounted price.</p>
        <table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="border-radius:8px;background:#f97316;">
          <a href="https://example.com" style="display:inline-block;padding:12px 18px;color:#fff;text-decoration:none;font-weight:bold;">Claim Offer</a>
        </td></tr></table>
        <p style="margin:16px 0 0;font-size:13px;color:#6b7280;">Offer ends Friday at midnight.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`,
  },
  {
    id: 'pre-announcement',
    name: 'Product Announcement',
    subject: 'Introducing our newest feature',
    category: 'announcement',
    htmlContent: `<!doctype html><html><body style="margin:0;padding:0;background:#eef2ff;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 0;background:#eef2ff;">
  <tr><td align="center">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:14px;overflow:hidden;font-family:Arial,sans-serif;">
      <tr><td style="padding:24px;background:#312e81;color:#e0e7ff;">
        <h1 style="margin:0;font-size:25px;">New Release</h1>
        <p style="margin:8px 0 0;">Built to help your team move faster.</p>
      </td></tr>
      <tr><td style="padding:24px;color:#1f2937;line-height:1.7;">
        <h2 style="margin:0 0 12px;font-size:20px;">What’s new</h2>
        <p style="margin:0 0 12px;">Our latest update brings smarter automation, better collaboration, and improved analytics.</p>
        <p style="margin:0;">Read the full changelog and start using it today.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`,
  },
  {
    id: 'pre-welcome',
    name: 'Welcome Email',
    subject: 'Welcome aboard — let’s get started',
    category: 'welcome',
    htmlContent: `<!doctype html><html><body style="margin:0;padding:0;background:#f8fafc;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 0;background:#f8fafc;">
  <tr><td align="center">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:14px;overflow:hidden;font-family:Arial,sans-serif;">
      <tr><td style="padding:26px;text-align:center;background:#0ea5e9;color:#f0f9ff;">
        <h1 style="margin:0;font-size:28px;">Welcome!</h1>
      </td></tr>
      <tr><td style="padding:24px;color:#334155;line-height:1.7;">
        <p style="margin:0 0 12px;">We’re excited to have you here. This email will help you get started in minutes.</p>
        <ol style="padding-left:20px;margin:0;">
          <li>Complete your profile</li>
          <li>Invite your team</li>
          <li>Start your first project</li>
        </ol>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`,
  },
];
