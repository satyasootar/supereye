import Link from 'next/link';
import { AiBot } from '@/components/os/ai-bot';
import { LandingSection } from './landing-section';

const FOOTER_LINKS = {
  Product: [
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'About', href: '/about' },
    { label: 'Dashboard', href: '/workspace' },
  ],
  Company: [
    { label: 'Contact', href: 'mailto:legal@supereye.app' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ],
  Resources: [
    { label: 'LLM summary', href: '/llms.txt' },
    { label: 'Sitemap', href: '/sitemap.xml' },
    { label: 'Sign in', href: '/login' },
  ],
};

export function LandingFooter() {
  return (
    <footer className="border-t border-border-subtle bg-bg-surface/30">
      <LandingSection className="py-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-2.5">
              <AiBot
                openAgentOnClick={false}
                hideWhenAgentOpen={false}
                disableClick
                size="sm"
              />
              <span className="font-heading text-[15px] font-semibold text-text-primary">
                Supereye
              </span>
            </div>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-text-muted">
              Your unified daily command center. Gmail, Calendar, and AI — one intelligent workspace.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <h4 className="text-[12px] font-semibold uppercase tracking-wider text-text-primary">
                {group}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-text-muted transition-colors hover:text-text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border-subtle pt-8 sm:flex-row">
          <p className="text-[12px] text-text-muted">
            © {new Date().getFullYear()} Supereye. All rights reserved.
          </p>
          <p className="font-mono text-[11px] text-text-muted">
            Built with Corsair · Next.js · PostgreSQL
          </p>
        </div>
      </LandingSection>
    </footer>
  );
}
