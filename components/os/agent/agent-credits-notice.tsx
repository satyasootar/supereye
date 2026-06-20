'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useAiCreditsGate } from '@/hooks/use-ai-credits-gate';
import { formatCreditsExact } from '@/lib/billing/format';
import { TOKEN_SUPPORT_EMAIL } from '@/lib/billing/constants';
import { cn } from '@/lib/utils';

export function AgentCreditsNotice({ className }: { className?: string }) {
  const { isLoading, blocked, exhausted, insufficient, remaining, chatCost, aiEnabled } =
    useAiCreditsGate();

  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    setIsDismissed(false);
  }, [blocked, exhausted, insufficient]);

  if (isLoading || !blocked || isDismissed) return null;

  let message = '';
  let actionText = '';
  let actionHref = '';
  let isMailto = false;

  if (!aiEnabled) {
    message = 'AI chat is not included on your plan.';
    actionText = 'Upgrade plan';
    actionHref = '/workspace/profile?tab=billing';
  } else if (exhausted) {
    message = 'AI credits exhausted.';
    actionText = 'Top up';
    actionHref = '/workspace/profile?tab=billing';
  } else {
    message = `Not enough credits (Requires ${formatCreditsExact(chatCost)} credits).`;
    actionText = 'Request credits';
    actionHref = `mailto:${TOKEN_SUPPORT_EMAIL}?subject=AI%20credit%20request`;
    isMailto = true;
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2 text-xs transition-all duration-300',
        'bg-bg-elevated/95 shadow-md backdrop-blur-xl',
        exhausted || !aiEnabled
          ? 'border-destructive/30 text-text-primary'
          : 'border-amber-500/30 text-text-primary',
        className
      )}
      role="alert"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full shrink-0 animate-pulse',
            exhausted || !aiEnabled ? 'bg-destructive' : 'bg-amber-500'
          )}
        />
        <span className="truncate font-medium text-[12.5px]">{message}</span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {isMailto ? (
          <a
            href={actionHref}
            className="font-semibold text-accent-blue hover:text-accent-blue-dim underline underline-offset-2 transition-colors text-[12px]"
          >
            {actionText}
          </a>
        ) : (
          <Link
            href={actionHref}
            className="font-semibold text-accent-blue hover:text-accent-blue-dim underline underline-offset-2 transition-colors text-[12px]"
          >
            {actionText}
          </Link>
        )}
        
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="rounded-md p-1 text-text-muted hover:text-text-primary hover:bg-bg-highlight/50 transition-colors"
          aria-label="Dismiss notice"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
