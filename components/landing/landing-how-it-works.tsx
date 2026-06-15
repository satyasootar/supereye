'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Link2, LayoutDashboard } from 'lucide-react';
import { LandingSection, SectionHeader } from './landing-section';

const STEPS = [
  {
    icon: Link2,
    title: 'Connect your accounts',
    description:
      'Sign in with Google and link Gmail and Calendar in one flow. Corsair handles OAuth, token refresh, and webhooks.',
  },
  {
    icon: LayoutDashboard,
    title: 'See your day unified',
    description:
      'Your inbox and schedule appear side by side. AI triage sorts urgent mail while your calendar stays in sync.',
  },
  {
    icon: ArrowRight,
    title: 'Command your workflow',
    description:
      'Use keyboard shortcuts, the command palette, and the AI agent to reply, schedule, and move through your day.',
  },
];

export function LandingHowItWorks() {
  const reduceMotion = useReducedMotion();

  return (
    <LandingSection className="border-t border-border-subtle bg-bg-surface/50">
      <SectionHeader
        eyebrow="How it works"
        title="Up and running in minutes"
        description="No migration, no new email address. Supereye wraps the tools you already use."
      />

      <div className="relative grid gap-8 md:grid-cols-3 md:gap-6">
        <div
          aria-hidden
          className="pointer-events-none absolute top-12 right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-transparent via-border-default to-transparent md:block"
        />

        {STEPS.map((step, i) => (
          <motion.div
            key={step.title}
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col items-center text-center md:items-start md:text-left"
          >
            <div className="relative mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-border-subtle bg-bg-elevated text-accent-blue shadow-sm">
              <step.icon className="h-5 w-5" />
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent-blue font-mono text-[10px] font-bold text-text-inverse">
                {i + 1}
              </span>
            </div>
            <h3 className="font-heading text-lg font-semibold text-text-primary">
              {step.title}
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">
              {step.description}
            </p>
          </motion.div>
        ))}
      </div>
    </LandingSection>
  );
}
