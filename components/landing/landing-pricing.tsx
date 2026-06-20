'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { formatCredits } from '@/lib/billing/format';
import { LandingSection, SectionHeader } from './landing-section';

const USD_TO_INR = 96;

type CurrencyMode = 'usd' | 'inr';

type PlanDef = {
  name: string;
  monthlyUsdCents: number | null;
  period: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  highlighted: boolean;
};

function formatPlanPrice(monthlyUsdCents: number | null, currency: CurrencyMode): string {
  if (monthlyUsdCents == null) return 'Custom';
  if (currency === 'usd') {
    const usd = monthlyUsdCents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(usd);
  }

  const inr = Math.round((monthlyUsdCents / 100) * USD_TO_INR);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(inr);
}

const PLANS: PlanDef[] = [
  {
    name: 'Free',
    monthlyUsdCents: 0,
    period: '/month',
    description: 'For plugin-first workflows with no AI features enabled.',
    features: [
      'Connect Gmail, Calendar, GitHub, and Drive plugins',
      'Unlimited plugin connections',
      'Unified split workspace',
      'No AI chat, AI summary, AI triage, or AI drafting',
      `${formatCredits(0)} AI credits / month`,
    ],
    cta: 'Start free',
    href: '/login',
    highlighted: false,
  },
  {
    name: 'Starter',
    monthlyUsdCents: 2000,
    period: '/month',
    description: 'Default plan for new users with AI access and full workspace features.',
    features: [
      'Everything in Free',
      'Unlimited plugin connections',
      'AI chat, triage & draft replies',
      `${formatCredits(10_000)} AI credits / month`,
      'Keyboard shortcuts & command palette',
    ],
    cta: 'Get started',
    href: '/login',
    highlighted: false,
  },
  {
    name: 'Pro',
    monthlyUsdCents: 10000,
    period: '/month',
    description: 'For power users who need more AI capacity and integrations.',
    features: [
      'Everything in Starter',
      `${formatCredits(100_000)} AI credits / month`,
      'Unlimited plugin connections',
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
    monthlyUsdCents: null,
    period: '',
    description: 'For teams that need custom limits, admin controls, and dedicated support.',
    features: [
      'Everything in Pro',
      'Custom AI credit allocation',
      'Unlimited integrations & seats',
      'Admin + super admin controls',
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
  const [currency, setCurrency] = useState<CurrencyMode>('usd');
  const plans = useMemo(
    () =>
      PLANS.map((plan) => ({
        ...plan,
        price: formatPlanPrice(plan.monthlyUsdCents, currency),
      })),
    [currency]
  );

  return (
    <LandingSection id="pricing" className="bg-bg-app">
      <SectionHeader
        eyebrow="Pricing"
        title="Simple, transparent pricing"
        description="Choose plugins-only or AI-enabled plans. AI usage is controlled with credits based on your selected plan."
      />

      <div className="mb-5 flex items-center justify-end">
        <div className="inline-flex rounded-lg border border-border-default bg-bg-surface p-1">
          <button
            type="button"
            onClick={() => setCurrency('usd')}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              currency === 'usd'
                ? 'bg-accent-blue text-text-inverse'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            USD
          </button>
          <button
            type="button"
            onClick={() => setCurrency('inr')}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              currency === 'inr'
                ? 'bg-accent-blue text-text-inverse'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            INR
          </button>
        </div>
        <span className="ml-3 text-xs text-text-muted">1 USD = 96 INR</span>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan, i) => (
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
