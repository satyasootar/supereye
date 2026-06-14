'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export function LandingHero({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 pt-16 text-center md:pt-24">
      <div className="landing-tag-glow inline-flex items-center gap-2 rounded-full bg-bg-elevated px-4 py-1.5 text-[12px] font-semibold text-accent-blue-dim">
        <Sparkles className="h-3.5 w-3.5" />
        <span>Keyboard-first workspace agent</span>
      </div>

      <h1 className="font-heading text-4xl font-bold leading-[1.08] tracking-tight text-text-primary sm:text-5xl md:text-6xl">
        Your inbox, calendar, and agent.{' '}
        <span className="text-accent-blue">One command center.</span>
      </h1>

      <p className="max-w-2xl text-base leading-relaxed text-text-secondary sm:text-lg">
        supereye unifies Gmail, Google Calendar, and AI triage into a single
        workspace. Triage urgent mail, schedule from threads, and run your agent
        without switching tabs.
      </p>

      <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
        {isLoggedIn ? (
          <Link
            href="/workspace"
            className="landing-btn-primary inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-[15px] font-semibold text-text-inverse transition-all"
          >
            Open workspace
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            href="/login"
            className="landing-btn-primary inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-[15px] font-semibold text-text-inverse transition-all"
          >
            Start building
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        <a
          href="#workspace"
          className="inline-flex items-center gap-2 rounded-2xl border border-border-default bg-bg-elevated px-7 py-3.5 text-[15px] font-semibold text-text-secondary transition-all landing-float-sm hover:text-text-primary"
        >
          Try the demo
        </a>
      </div>
    </section>
  );
}
