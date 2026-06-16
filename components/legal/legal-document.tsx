import Link from 'next/link';
import { LandingNavbar } from '@/components/landing/landing-navbar';
import { LandingFooter } from '@/components/landing/landing-footer';
import { LandingSection } from '@/components/landing/landing-section';
import { cn } from '@/lib/utils';

type TocItem = { id: string; label: string };

type LegalDocumentProps = {
  title: string;
  description: string;
  lastUpdated: string;
  toc?: TocItem[];
  children: React.ReactNode;
};

export function LegalDocument({
  title,
  description,
  lastUpdated,
  toc,
  children,
}: LegalDocumentProps) {
  return (
    <div className="min-h-screen w-full bg-bg-app">
      <div className="relative mx-auto w-full max-w-[1440px] min-w-0 border-b border-border-subtle">
        <LandingNavbar />
      </div>

      <LandingSection className="py-12 md:py-16">
        <article className="mx-auto max-w-3xl">
          <header className="mb-10 border-b border-border-subtle pb-8">
            <p className="mb-2 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-accent-blue">
              Legal
            </p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-text-primary md:text-4xl">
              {title}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-text-secondary">{description}</p>
            <p className="mt-4 text-sm text-text-muted">
              Last updated:{' '}
              <time dateTime={lastUpdated}>
                {new Date(lastUpdated).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </p>
          </header>

          {toc && toc.length > 0 && (
            <nav
              aria-label="Table of contents"
              className="mb-10 rounded-xl border border-border-subtle bg-bg-surface/50 p-5"
            >
              <h2 className="text-sm font-semibold text-text-primary">On this page</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-text-secondary">
                {toc.map((item) => (
                  <li key={item.id}>
                    <Link href={`#${item.id}`} className="hover:text-text-primary hover:underline">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <div
            className={cn(
              'legal-prose space-y-6 text-[15px] leading-relaxed text-text-secondary',
              '[&_h2]:mt-10 [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-text-primary',
              '[&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-text-primary',
              '[&_p]:text-text-secondary [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5',
              '[&_a]:text-accent-blue [&_a]:underline [&_a]:underline-offset-2'
            )}
          >
            {children}
          </div>
        </article>
      </LandingSection>

      <LandingFooter />
    </div>
  );
}
