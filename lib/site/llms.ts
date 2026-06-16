import { getSiteUrl, PUBLIC_PAGES, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from './config';

export function buildLlmsTxt(extended = false): string {
  const base = getSiteUrl();
  const lines: string[] = [
    `# ${SITE_NAME}`,
    `> ${SITE_TAGLINE}. ${SITE_DESCRIPTION}`,
    '',
    'Supereye is a web application (Next.js) that provides a unified inbox and workspace.',
    'Users sign in with Google OAuth or email/password. Integrations include Gmail, Google Calendar, and GitHub via Corsair.',
    'Authenticated areas: /workspace (main app), /workspace/profile, /admin (super admins only).',
    '',
    '## Public pages',
    '',
  ];

  for (const page of PUBLIC_PAGES) {
    lines.push(`- [${page.title}](${base}${page.path}): ${page.description}`);
  }

  lines.push(
    '',
    '## Machine-readable',
    '',
    `- [Sitemap](${base}/sitemap.xml): XML sitemap for crawlers`,
    `- [Robots](${base}/robots.txt): Crawler rules`,
    `- [LLMs full text](${base}/llms-full.txt): Extended product summary for AI agents`,
    '',
    '## Product capabilities',
    '',
    '- Unified Gmail inbox with thread view, search, archive, star, reply, and send',
    '- Google Calendar sync, event creation from email, availability checks',
    '- AI agent chat and email triage (urgent vs can-wait)',
    '- GitHub integration via Corsair',
    '- Keyboard shortcuts and command palette',
    '- Token-based billing for AI usage',
    '- Workspaces with configurable plugin layout',
    '',
    '## Optional',
    '',
    `- Sign in: ${base}/login`,
    `- Main app (requires account): ${base}/workspace`,
  );

  if (extended) {
    lines.push(
      '',
      '## Extended overview',
      '',
      '### Audience',
      'Knowledge workers and developers who live in email and calendar and want fewer tabs.',
      '',
      '### Data handling (summary)',
      'Account data (name, email) is stored in PostgreSQL. Gmail and Calendar data is synced via Google APIs and cached locally for performance. OAuth tokens are managed through Corsair. See the Privacy Policy for full details.',
      '',
      '### Technology',
      'Next.js, React, PostgreSQL, Drizzle ORM, Auth.js, Corsair integrations, Mistral/OpenAI for AI features.',
      '',
      '### Support',
      'Contact: legal@supereye.app for privacy and terms inquiries.',
    );
  }

  return lines.join('\n');
}
