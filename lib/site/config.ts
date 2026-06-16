/** Central site metadata for SEO, legal pages, and llms.txt. */
export const SITE_NAME = 'Supereye';

export const SITE_TAGLINE = 'Your unified daily command center';

export const SITE_DESCRIPTION =
  'Supereye is a keyboard-first workspace that unifies Gmail, Google Calendar, GitHub, and AI triage in one fast inbox. Schedule from email threads, triage urgency, and manage integrations without context switching.';

export const SITE_KEYWORDS = [
  'unified inbox',
  'Gmail workspace',
  'Google Calendar',
  'email triage',
  'AI email assistant',
  'keyboard-first email',
  'productivity workspace',
  'GitHub notifications',
] as const;

export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (url) return url;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export const LEGAL_CONTACT_EMAIL = 'legal@supereye.app';

export const PUBLIC_PAGES = [
  {
    path: '/',
    title: 'Home',
    description: SITE_DESCRIPTION,
  },
  {
    path: '/about',
    title: 'About Supereye',
    description:
      'What Supereye is, who it is for, core features, integrations, and how the product works.',
  },
  {
    path: '/privacy',
    title: 'Privacy Policy',
    description:
      'How Supereye collects, uses, stores, and protects your data when you use the service.',
  },
  {
    path: '/terms',
    title: 'Terms of Service',
    description:
      'Terms and conditions governing access to and use of the Supereye application.',
  },
] as const;
