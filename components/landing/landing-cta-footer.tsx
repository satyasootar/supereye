'use client';

import Link from 'next/link';
import { ArrowRight, Eye } from 'lucide-react';

export function LandingCta({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section className="px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-3xl">
        <div className="relative overflow-hidden rounded-3xl border border-border-subtle bg-bg-elevated p-8 text-center landing-float md:p-12">
          {/* Vent pattern top */}
          <div className="absolute left-1/2 top-4 flex -translate-x-1/2 gap-1 opacity-40">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-3 w-1 rounded-full bg-bg-overlay landing-soft-inset" />
            ))}
          </div>

          {/* Circuit lines */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full opacity-30"
            viewBox="0 0 400 200"
            preserveAspectRatio="none"
          >
            <path
              d="M0 100 H80 Q120 100 140 60 H200"
              fill="none"
              stroke="var(--border-default)"
              strokeWidth="0.5"
            />
            <path
              d="M400 100 H320 Q280 100 260 140 H200"
              fill="none"
              stroke="var(--border-default)"
              strokeWidth="0.5"
            />
          </svg>

          <div className="relative z-10">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              Ready to command your day?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-text-secondary">
              Connect Gmail and Calendar in minutes. Let supereye triage, draft, and
              schedule while you stay in flow.
            </p>

            <div className="mx-auto mt-8 inline-flex rounded-2xl border border-border-subtle bg-bg-surface/60 p-2 backdrop-blur-sm">
              {isLoggedIn ? (
                <Link
                  href="/workspace"
                  className="landing-btn-primary inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-[15px] font-semibold text-text-inverse transition-all"
                >
                  Open workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="landing-btn-primary inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-[15px] font-semibold text-text-inverse transition-all"
                >
                  Start building
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>

          {/* Vent pattern bottom */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1 opacity-40">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-3 w-1 rounded-full bg-bg-overlay landing-soft-inset" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-border-subtle bg-bg-surface/50 px-4 py-10 md:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl landing-soft-raised bg-accent-blue text-text-inverse">
              <Eye className="h-4 w-4" />
            </div>
            <span className="font-heading text-[15px] font-semibold text-text-primary">
              supereye
            </span>
          </div>
          <p className="max-w-xs text-[12px] leading-relaxed text-text-muted">
            Keyboard-first workspace for Gmail, Calendar, and AI agents. Built with
            Corsair integrations.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              Product
            </p>
            <ul className="mt-3 space-y-2">
              {['Features', 'Integrations', 'Workspace'].map((item) => (
                <li key={item}>
                  <a
                    href={`#${item.toLowerCase()}`}
                    className="text-[12px] text-text-secondary transition-colors hover:text-text-primary"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              Resources
            </p>
            <ul className="mt-3 space-y-2">
              {['How it works', 'Testimonials', 'Sign in'].map((item) => (
                <li key={item}>
                  <a
                    href={item === 'Sign in' ? '/login' : `#${item.toLowerCase().replace(/ /g, '-')}`}
                    className="text-[12px] text-text-secondary transition-colors hover:text-text-primary"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              Legal
            </p>
            <ul className="mt-3 space-y-2">
              {['Privacy', 'Terms', 'Security'].map((item) => (
                <li key={item}>
                  <span className="text-[12px] text-text-muted">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-6xl border-t border-border-subtle pt-6 text-center text-[11px] text-text-muted">
        © {new Date().getFullYear()} supereye. All rights reserved.
      </div>
    </footer>
  );
}
