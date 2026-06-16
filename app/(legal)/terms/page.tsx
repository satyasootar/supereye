import { LegalDocument } from '@/components/legal/legal-document';
import { createPageMetadata } from '@/lib/site/metadata';
import { LEGAL_CONTACT_EMAIL } from '@/lib/site/config';
import Link from 'next/link';

const LAST_UPDATED = '2026-06-16';

export const metadata = createPageMetadata({
  title: 'Terms of Service',
  description:
    'Terms and conditions for using the Supereye application, including accounts, billing, acceptable use, and limitations of liability.',
  path: '/terms',
});

const TOC = [
  { id: 'agreement', label: 'Agreement' },
  { id: 'eligibility', label: 'Eligibility and accounts' },
  { id: 'service', label: 'The service' },
  { id: 'acceptable-use', label: 'Acceptable use' },
  { id: 'billing', label: 'Billing and tokens' },
  { id: 'ip', label: 'Intellectual property' },
  { id: 'disclaimers', label: 'Disclaimers' },
  { id: 'liability', label: 'Limitation of liability' },
  { id: 'termination', label: 'Termination' },
  { id: 'changes', label: 'Changes' },
  { id: 'contact', label: 'Contact' },
];

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Service"
      description="These terms govern your access to and use of Supereye. Please read them carefully before creating an account."
      lastUpdated={LAST_UPDATED}
      toc={TOC}
    >
      <section id="agreement">
        <h2>Agreement</h2>
        <p>
          These Terms of Service (&quot;Terms&quot;) are a binding agreement between you and
          Supereye. By accessing our website, signing in, or using the application, you agree to
          these Terms and our <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </section>

      <section id="eligibility">
        <h2>Eligibility and accounts</h2>
        <p>
          You must be at least 16 years old and able to form a binding contract. You are responsible
          for maintaining the confidentiality of your credentials and for all activity under your
          account. Notify us promptly of unauthorized use.
        </p>
        <p>
          Google sign-in and optional email/password authentication are provided for individual and
          authorized organizational use. Enterprise accounts may be subject to additional agreements.
        </p>
      </section>

      <section id="service">
        <h2>The service</h2>
        <p>
          Supereye provides a web-based workspace for email, calendar, integrations, and AI-assisted
          workflows. Features may change over time. We may add, modify, or discontinue functionality
          with reasonable notice when practicable.
        </p>
        <p>
          You grant Supereye permission to access connected third-party accounts solely to provide
          features you enable. You represent that you have the right to connect those accounts.
        </p>
      </section>

      <section id="acceptable-use">
        <h2>Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the service for unlawful, harmful, or abusive purposes</li>
          <li>Attempt to bypass security, access other users&apos; data, or probe systems without authorization</li>
          <li>Send spam, malware, or content that violates applicable law</li>
          <li>Reverse engineer or resell the service except as permitted by law</li>
          <li>Use automated means to scrape or overload the service without our written consent</li>
        </ul>
        <p>
          We may suspend or terminate accounts that violate these Terms or pose a security risk.
        </p>
      </section>

      <section id="billing">
        <h2>Billing and tokens</h2>
        <p>
          Certain AI features consume tokens according to your plan. Paid top-ups and enterprise
          plans are billed as described at purchase. Fees are non-refundable except where required by
          law. Simulated billing may be enabled in development environments only.
        </p>
      </section>

      <section id="ip">
        <h2>Intellectual property</h2>
        <p>
          Supereye and its branding, software, and documentation are owned by us or our licensors.
          You retain ownership of your content. You grant us a limited license to host, process, and
          display your content solely to operate the service.
        </p>
      </section>

      <section id="disclaimers">
        <h2>Disclaimers</h2>
        <p>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF
          ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
          AND NON-INFRINGEMENT. AI-generated suggestions may be inaccurate; you are responsible for
          reviewing outputs before relying on them.
        </p>
      </section>

      <section id="liability">
        <h2>Limitation of liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, SUPEREYE WILL NOT BE LIABLE FOR INDIRECT,
          INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR
          GOODWILL. OUR TOTAL LIABILITY FOR ANY CLAIM ARISING FROM THESE TERMS OR THE SERVICE IS
          LIMITED TO THE AMOUNT YOU PAID US IN THE TWELVE MONTHS BEFORE THE CLAIM, OR ONE HUNDRED US
          DOLLARS IF YOU HAVE NOT PAID US.
        </p>
      </section>

      <section id="termination">
        <h2>Termination</h2>
        <p>
          You may stop using Supereye at any time and delete your account from Profile settings. We
          may terminate or suspend access for breach of these Terms. Provisions that by nature should
          survive termination will remain in effect.
        </p>
      </section>

      <section id="changes">
        <h2>Changes</h2>
        <p>
          We may update these Terms. We will post the revised version with an updated date. Continued
          use after changes constitutes acceptance. Material changes may be communicated by email or
          in-app notice where appropriate.
        </p>
      </section>

      <section id="contact">
        <h2>Contact</h2>
        <p>
          Legal inquiries:{' '}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>
        </p>
        <p>
          See also: <Link href="/about">About Supereye</Link> ·{' '}
          <Link href="/privacy">Privacy Policy</Link>
        </p>
      </section>
    </LegalDocument>
  );
}
