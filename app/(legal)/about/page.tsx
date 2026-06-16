import Link from 'next/link';
import { LegalDocument } from '@/components/legal/legal-document';
import { JsonLd } from '@/components/seo/json-ld';
import { PUBLIC_PAGES, SITE_DESCRIPTION } from '@/lib/site/config';
import { createPageMetadata } from '@/lib/site/metadata';
import { softwareApplicationJsonLd } from '@/lib/site/structured-data';

export const metadata = createPageMetadata({
  title: 'About Supereye',
  description:
    'Supereye unifies Gmail, Google Calendar, GitHub, and AI triage in one keyboard-first workspace. Learn what the app does and who it is for.',
  path: '/about',
});

const FEATURES = [
  {
    title: 'Unified inbox',
    body: 'Read, search, archive, star, reply, and send Gmail without leaving the workspace. Thread view keeps context in one place.',
  },
  {
    title: 'Calendar alongside email',
    body: 'Sync Google Calendar, check availability, and create events from email threads with attendees pre-filled.',
  },
  {
    title: 'AI triage and agent',
    body: 'Classify mail as urgent or can-wait, get smart notifications, and chat with an AI agent grounded in your workspace context.',
  },
  {
    title: 'Integrations',
    body: 'Connect Gmail, Google Calendar, and GitHub through Corsair OAuth. More plugins can be added as the platform grows.',
  },
  {
    title: 'Keyboard-first',
    body: 'Command palette, customizable shortcuts, and fast navigation for power users who prefer the keyboard.',
  },
  {
    title: 'Workspaces',
    body: 'Configure primary and sidebar plugins per workspace so different workflows get the right layout.',
  },
] as const;

export default function AboutPage() {
  return (
    <>
      <JsonLd data={softwareApplicationJsonLd()} />
      <LegalDocument
        title="About Supereye"
        description={SITE_DESCRIPTION}
        lastUpdated="2026-06-16"
      >
        <section id="what-is-supereye">
          <h2>What is Supereye?</h2>
          <p>
            Supereye is a web application that combines email, calendar, integrations, and AI into a
            single daily command center. Instead of switching between Gmail, Google Calendar, and
            separate notification feeds, you work in one fast interface designed for focus and
            keyboard-driven productivity.
          </p>
        </section>

        <section id="who-its-for">
          <h2>Who it&apos;s for</h2>
          <p>
            Supereye is built for knowledge workers, founders, and developers who spend significant
            time in email and meetings and want less context switching. If you triage a busy inbox,
            schedule from threads, and care about speed, Supereye is for you.
          </p>
        </section>

        <section id="features">
          <h2>Core features</h2>
          <ul>
            {FEATURES.map((feature) => (
              <li key={feature.title}>
                <strong>{feature.title}.</strong> {feature.body}
              </li>
            ))}
          </ul>
        </section>

        <section id="how-it-works">
          <h2>How it works</h2>
          <ol className="list-decimal space-y-3 pl-5">
            <li>
              <Link href="/login">Sign in</Link> with Google or email/password.
            </li>
            <li>Connect Gmail, Google Calendar, and optional integrations from your profile.</li>
            <li>
              Open <Link href="/workspace">your workspace</Link> to read mail, manage calendar, and
              use AI tools.
            </li>
            <li>Use keyboard shortcuts and the command palette to move quickly.</li>
          </ol>
        </section>

        <section id="public-pages">
          <h2>Site map</h2>
          <p>Public pages on this site:</p>
          <ul>
            {PUBLIC_PAGES.map((page) => (
              <li key={page.path}>
                <Link href={page.path}>{page.title}</Link> — {page.description}
              </li>
            ))}
            <li>
              <Link href="/login">Sign in</Link> — Authenticate to access the workspace
            </li>
          </ul>
          <p className="mt-4 text-sm text-text-muted">
            Machine-readable:{' '}
            <a href="/llms.txt">llms.txt</a> · <a href="/llms-full.txt">llms-full.txt</a> ·{' '}
            <a href="/sitemap.xml">sitemap.xml</a> · <a href="/robots.txt">robots.txt</a>
          </p>
        </section>

        <section id="legal">
          <h2>Legal</h2>
          <p>
            <Link href="/privacy">Privacy Policy</Link> · <Link href="/terms">Terms of Service</Link>
          </p>
        </section>
      </LegalDocument>
    </>
  );
}
