'use client';

import { motion } from 'framer-motion';
import { Sparkles, ShieldAlert } from 'lucide-react';

export function DemoOnboardingBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto mb-8 w-full max-w-2xl overflow-hidden rounded-xl border border-accent-blue/25 bg-gradient-to-br from-accent-blue/[0.08] via-bg-elevated to-bg-elevated shadow-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex gap-4 p-4 sm:p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-accent-blue/20 bg-accent-blue/10">
          <Sparkles className="h-5 w-5 text-accent-blue" aria-hidden />
        </div>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[14px] font-semibold text-text-primary">Demo account</p>
            <span className="rounded-full border border-accent-blue/30 bg-accent-blue/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-blue">
              Pro plan
            </span>
          </div>
          <p className="text-[13px] leading-relaxed text-text-secondary">
            You&apos;re exploring Supereye with our shared demo account on the{' '}
            <strong className="font-medium text-text-primary">Pro plan</strong>. Everything you
            see here — limits, AI features, and workspace behavior — matches what regular Pro
            users experience.
          </p>
          <p className="flex items-start gap-2 text-[12px] leading-relaxed text-text-muted">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500/90" aria-hidden />
            <span>
              This account is for trying the product only. Please don&apos;t misuse it — avoid
              sending spam, changing shared settings, or doing anything that would disrupt others
              exploring the demo.
            </span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
