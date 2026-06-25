'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Keyboard, Loader2, MousePointerClick } from 'lucide-react';
import {
  ShortcutsReference,
  ShortcutsFooterHint,
} from '@/components/keyboard/shortcuts-reference';
import { DemoOnboardingBanner } from '@/components/onboarding/demo-onboarding-banner';
import { cn } from '@/lib/utils';

type OnboardingShortcutsStepProps = {
  onContinue: () => void;
  onBack?: () => void;
  finishing?: boolean;
  isDemoAccount?: boolean;
};

export function OnboardingShortcutsStep({
  onContinue,
  onBack,
  finishing = false,
  isDemoAccount = false,
}: OnboardingShortcutsStepProps) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-bg-app">
      <div className="relative flex-1 overflow-y-auto custom-scrollbar">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 70% 45% at 50% 0%, rgba(66,133,244,0.14), transparent), radial-gradient(ellipse 50% 35% at 100% 80%, rgba(52,168,83,0.08), transparent)',
          }}
        />

        <div className="relative mx-auto w-full max-w-2xl px-6 py-10 pb-8">
          {isDemoAccount && <DemoOnboardingBanner />}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-blue">
              Step 2 of 2
            </p>
            <h1 className="mt-3 text-[30px] font-semibold tracking-tight text-text-primary sm:text-[34px]">
              Built for your keyboard
            </h1>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-text-muted">
              Supereye is keyboard-first. Learn a handful of shortcuts now — you&apos;ll move
              through workspaces and cycle active plugins without reaching for the mouse.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            className="mt-10"
          >
            <ShortcutsReference variant="featured" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.35 }}
            className="mt-8 rounded-xl border border-border-subtle bg-bg-elevated/70 p-5"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-highlight">
                <MousePointerClick className="h-4 w-4 text-text-muted" />
              </div>
              <div className="space-y-2">
                <p className="text-[13px] font-medium text-text-primary">
                  Two modes — always visible in the status bar
                </p>
                <p className="text-[12px] leading-relaxed text-text-muted">
                  <span className="font-mono text-text-secondary">● COMMAND</span> — shortcuts
                  are active. <span className="font-mono text-text-secondary">◎ INSERT</span> —
                  you&apos;re typing in a field; single-key shortcuts pause until you press{' '}
                  <span className="font-mono text-text-secondary">Esc</span>.
                </p>
                <ShortcutsFooterHint />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <footer className="z-[200] shrink-0 border-t border-border-subtle bg-bg-app px-6 py-4 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="hidden text-[13px] text-text-muted sm:block">
            Open Profile → Shortcuts anytime to customize bindings
          </p>
          <div className="flex w-full items-center gap-3 sm:w-auto">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                disabled={finishing}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-md border border-border-default bg-bg-surface px-5 py-3 text-[14px] font-semibold text-text-primary transition-all',
                  'hover:border-border-strong hover:bg-bg-highlight active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-initial sm:min-w-[140px]'
                )}
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </button>
            )}
            <button
              type="button"
              disabled={finishing}
              onClick={onContinue}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-md bg-accent-blue px-5 py-3 text-[14px] font-semibold text-text-inverse shadow-lg shadow-accent-blue/20 transition-all',
                'hover:bg-accent-blue-dim active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none sm:flex-initial sm:min-w-[180px]'
              )}
            >
              {finishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Enter workspace
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
