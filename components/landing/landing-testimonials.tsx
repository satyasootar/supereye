'use client';

import { Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    quote:
      'I stopped living in five tabs. supereye triages my inbox before I even open it, and the keyboard shortcuts mean I never reach for the mouse.',
    name: 'Priya Sharma',
    role: 'Engineering lead',
    company: 'Northline Labs',
  },
  {
    quote:
      'The agent drafts replies from calendar context. I confirm, it sends. That one flow alone saves me an hour every morning.',
    name: 'Marcus Webb',
    role: 'Product manager',
    company: 'Relay Systems',
  },
  {
    quote:
      'Corsair integrations mean my data stays where I want it. Gmail and Calendar sync feels instant, and the AI triage actually understands urgency.',
    name: 'Elena Vasquez',
    role: 'Founder',
    company: 'Draftboard',
  },
];

export function LandingTestimonials() {
  return (
    <section id="testimonials" className="scroll-mt-24 px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <span className="landing-tag-glow inline-flex rounded-full bg-bg-elevated px-3 py-1 text-[11px] font-semibold text-accent-blue-dim">
            Testimonials
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
            Built for people who live in their inbox.
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <article
              key={t.name}
              className="flex flex-col rounded-2xl border border-border-subtle bg-bg-elevated p-6 landing-float-sm"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-3.5 w-3.5 fill-accent-blue text-accent-blue"
                  />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-[13px] leading-relaxed text-text-secondary">
                &quot;{t.quote}&quot;
              </blockquote>
              <div className="mt-5 border-t border-border-subtle pt-4">
                <p className="text-[13px] font-semibold text-text-primary">{t.name}</p>
                <p className="text-[11px] text-text-muted">
                  {t.role}, {t.company}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
