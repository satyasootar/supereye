import { LegalDocument } from '@/components/legal/legal-document';
import { createPageMetadata } from '@/lib/site/metadata';
import { LEGAL_CONTACT_EMAIL } from '@/lib/site/config';
import Link from 'next/link';

const LAST_UPDATED = '2026-06-16';

export const metadata = createPageMetadata({
  title: 'Privacy Policy',
  description:
    'Learn how Supereye collects, uses, stores, and protects your personal data and connected account information.',
  path: '/privacy',
});

const TOC = [
  { id: 'overview', label: 'Overview' },
  { id: 'data-we-collect', label: 'Data we collect' },
  { id: 'how-we-use', label: 'How we use data' },
  { id: 'integrations', label: 'Third-party integrations' },
  { id: 'ai-features', label: 'AI features' },
  { id: 'retention', label: 'Data retention' },
  { id: 'security', label: 'Security' },
  { id: 'your-rights', label: 'Your rights' },
  { id: 'contact', label: 'Contact' },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      description="This policy explains what information Supereye processes when you use our service and the choices you have."
      lastUpdated={LAST_UPDATED}
      toc={TOC}
    >
      <section id="overview">
        <h2>Overview</h2>
        <p>
          Supereye (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates a unified workspace that
          connects your email, calendar, and productivity tools. This Privacy Policy describes how we
          handle personal information when you visit our marketing site, create an account, or use
          the application at{' '}
          <Link href="/workspace">/workspace</Link>.
        </p>
        <p>
          By using Supereye, you agree to the practices described here. Please also read our{' '}
          <Link href="/terms">Terms of Service</Link>.
        </p>
      </section>

      <section id="data-we-collect">
        <h2>Data we collect</h2>
        <h3>Account information</h3>
        <ul>
          <li>Name and email address from Google sign-in or registration</li>
          <li>Optional password hash if you enable email/password sign-in</li>
          <li>Profile preferences, workspace settings, and keyboard shortcut overrides</li>
        </ul>
        <h3>Connected service data</h3>
        <p>
          When you connect Gmail, Google Calendar, or GitHub, we access data through OAuth on your
          behalf. This may include email metadata and content, calendar events, and integration
          notifications needed to provide inbox, scheduling, and triage features. Data is synced and
          cached in our database to improve performance.
        </p>
        <h3>Usage and billing</h3>
        <ul>
          <li>AI usage events and token consumption for billing and quotas</li>
          <li>Password reset tokens and transactional emails when you request account recovery</li>
          <li>Audit logs for administrative actions (admin accounts only)</li>
          <li>Standard server logs (IP address, user agent, timestamps) for security and debugging</li>
        </ul>
      </section>

      <section id="how-we-use">
        <h2>How we use data</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Authenticate you and maintain your session</li>
          <li>Display, search, send, and organize email and calendar data you authorize</li>
          <li>Run AI triage, drafting, and agent features you request</li>
          <li>Process subscriptions, token top-ups, and enterprise billing</li>
          <li>Improve reliability, prevent abuse, and comply with legal obligations</li>
        </ul>
        <p>
          We do not sell your personal information. We do not use your private email content to train
          public foundation models.
        </p>
      </section>

      <section id="integrations">
        <h2>Third-party integrations</h2>
        <p>
          Supereye uses Google OAuth for sign-in and Corsair-powered integrations for Gmail, Google
          Calendar, and GitHub. Each provider&apos;s own privacy policy governs data they process.
          You can revoke access at any time by disconnecting integrations in your profile or through
          the provider&apos;s account settings.
        </p>
      </section>

      <section id="ai-features">
        <h2>AI features</h2>
        <p>
          When you use AI chat, triage, or reply assistance, relevant message context may be sent to
          configured AI providers (such as Mistral or OpenAI) to generate a response. We send only
          what is needed for the feature you invoke. AI outputs are shown to you in the app; you
          remain responsible for reviewing before sending email or taking action.
        </p>
      </section>

      <section id="retention">
        <h2>Data retention</h2>
        <p>
          We retain account and synced data while your account is active. If you delete your account,
          we remove or anonymize associated personal data within a reasonable period, except where
          retention is required for legal, security, or billing purposes.
        </p>
      </section>

      <section id="security">
        <h2>Security</h2>
        <p>
          We use industry-standard measures including encrypted transport (HTTPS), hashed passwords,
          scoped API access, webhook verification, and role-based access controls. No method of
          transmission or storage is completely secure; please use a strong password and protect your
          OAuth accounts.
        </p>
      </section>

      <section id="your-rights">
        <h2>Your rights</h2>
        <p>
          Depending on your location, you may have rights to access, correct, delete, or export your
          personal data, and to object to or restrict certain processing. To exercise these rights,
          contact us or delete your account from Profile settings.
        </p>
      </section>

      <section id="contact">
        <h2>Contact</h2>
        <p>
          Privacy questions:{' '}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>
        </p>
        <p>
          See also: <Link href="/about">About Supereye</Link> ·{' '}
          <Link href="/terms">Terms of Service</Link>
        </p>
      </section>
    </LegalDocument>
  );
}
