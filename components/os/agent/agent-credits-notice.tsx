'use client';

import Link from 'next/link';
import { Coins, Sparkles } from 'lucide-react';
import { useAiCreditsGate } from '@/hooks/use-ai-credits-gate';
import { formatCreditsExact } from '@/lib/billing/format';
import { TOKEN_SUPPORT_EMAIL } from '@/lib/billing/constants';
import { cn } from '@/lib/utils';

export function AgentCreditsNotice({ className }: { className?: string }) {
  const { isLoading, blocked, exhausted, insufficient, remaining, chatCost, aiEnabled } =
    useAiCreditsGate();

  if (isLoading || !blocked) return null;

  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3',
        exhausted
          ? 'border-[color:var(--priority-urgent)]/35 bg-[color:var(--priority-urgent)]/8'
          : 'border-amber-500/35 bg-amber-500/10',
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Coins
          className={cn(
            'mt-0.5 h-4 w-4 shrink-0',
            exhausted ? 'text-[color:var(--priority-urgent)]' : 'text-amber-600'
          )}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-primary">
            {!aiEnabled
              ? 'AI chat is not included on your plan'
              : exhausted
                ? 'AI credits exhausted'
                : 'Not enough credits for another message'}
          </p>
          <p className="mt-1 text-sm text-text-muted">
            {!aiEnabled ? (
              'Upgrade to a plan with AI features to use chat, scheduling, and other assistant tools.'
            ) : exhausted ? (
              'Chat is disabled until you get more credits. Top up credits, switch to a larger plan, or ask an admin to add credits to your account.'
            ) : (
              <>
                Each chat message costs {formatCreditsExact(chatCost)} credits. You have{' '}
                {formatCreditsExact(remaining)} left. Top up credits, upgrade your plan, or ask an
                admin for more.
              </>
            )}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/workspace/profile?tab=billing"
              className="inline-flex items-center gap-1.5 rounded-md bg-accent-blue px-3 py-1.5 text-xs font-semibold text-text-inverse transition-colors hover:bg-accent-blue-dim"
            >
              <Sparkles className="h-3.5 w-3.5" />
              View billing
            </Link>
            <a
              href={`mailto:${TOKEN_SUPPORT_EMAIL}?subject=AI%20credit%20request`}
              className="inline-flex items-center rounded-md border border-border-default bg-bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              Ask admin
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
