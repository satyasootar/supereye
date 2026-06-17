'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatTokens } from '@/lib/billing/format';
import {
  DEFAULT_PRO_TOKENS,
  DEFAULT_STARTER_TOKENS,
} from '@/lib/billing/constants';
import { LandingSection, SectionHeader } from './landing-section';

const PLANS = [
  {
    name: 'Starter',
    price: formatCurrency(2000),
    period: '/month',
    description: 'For individuals who want a unified inbox, calendar, and AI workflow.',
    features: [
      'Gmail + Calendar sync',
      'Up to 2 integrations',
      'Unified split workspace',
      'AI chat, triage & draft replies',
      `${formatTokens(DEFAULT_STARTER_TOKENS)} AI tokens / month`,
      'Keyboard shortcuts & command palette',
    ],
    cta: 'Get started',
    href: '/login',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: formatCurrency(10000),
    period: '/month',
    description: 'For power users who need more AI capacity and integrations.',
    features: [
      'Everything in Starter',
      `${formatTokens(DEFAULT_PRO_TOKENS)} AI tokens / month`,
      'Up to 5 integrations',
      'Priority AI processing',
      'Advanced automations',
      'Up to 3 team members',
    ],
    cta: 'Get started',
    href: '/login',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For teams that need custom limits, admin controls, and dedicated support.',
    features: [
      'Everything in Pro',
      'Custom token allocation',
      'Unlimited integrations & seats',
      'Admin dashboard',
      'Shared workspaces',
      'Dedicated support',
    ],
    cta: 'Contact sales',
    href: '#contact',
    highlighted: false,
  },
];

export function LandingPricing() {
  const reduceMotion = useReducedMotion();

  return (
    <LandingSection id="pricing" className="bg-bg-app">
      <SectionHeader
        eyebrow="Pricing"
        title="Simple, transparent pricing"
        description="Every plan includes the full Supereye workspace. Pick the token and integration limits that fit your workflow."
      />

      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'relative flex flex-col rounded-[var(--radius-2xl)] border p-6 md:p-7',
              plan.highlighted
                ? 'border-accent-blue/50 bg-bg-elevated shadow-[0_0_40px_color-mix(in_srgb,var(--accent-blue)_12%,transparent)]'
                : 'border-border-subtle bg-bg-elevated'
            )}
          >
            {plan.highlighted && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent-blue px-3 py-0.5 text-[11px] font-semibold text-text-inverse">
                Most popular
              </span>
            )}

            <div className="mb-6">
              <h3 className="font-heading text-lg font-semibold text-text-primary">
                {plan.name}
              </h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-heading text-4xl font-bold tracking-tight text-text-primary">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-sm text-text-muted">{plan.period}</span>
                )}
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-text-secondary">
                {plan.description}
              </p>
            </div>

            <ul className="mb-8 flex-1 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-[13px] text-text-secondary">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-blue" />
                  {feature}
                </li>
              ))}
            </ul>

            <Button
              asChild
              variant={plan.highlighted ? 'default' : 'outline'}
              size="lg"
              className="w-full"
            >
              <Link href={plan.href}>{plan.cta}</Link>
            </Button>
          </motion.div>
        ))}
      </div>
    </LandingSection>
  );
}
