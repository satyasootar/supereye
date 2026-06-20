'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Coins, Mail, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCreditsExact } from '@/lib/billing/format';
import { useBillingWallet } from '@/hooks/use-billing-wallet';
import { getCreditStatus, getWalletDisplayMetrics } from '@/lib/billing/wallet-math';
import {
  hasUnlimitedAiAccess,
  TOKEN_SUPPORT_EMAIL,
  TOKEN_SUPPORT_X_URL,
} from '@/lib/billing/constants';

export function CreditStatusBanner({ className }: { className?: string }) {
  const { data } = useBillingWallet();
  const [isDismissed, setIsDismissed] = useState(false);

  const hasUnlimited = !data?.wallet || hasUnlimitedAiAccess(data.role) || data.wallet.unlimited;
  const noAi = !!(data?.credits && !data.credits.aiEnabled);

  const metrics = getWalletDisplayMetrics({
    balance: data?.wallet?.balance ?? 0,
    monthlyAllocation: data?.wallet?.monthlyAllocation ?? 0,
    bonusAllocation: data?.wallet?.bonusAllocation ?? 0,
    usedThisPeriod: data?.wallet?.usedThisPeriod ?? 0,
  });
  const status = getCreditStatus(metrics);

  useEffect(() => {
    if (status !== 'ok') {
      const dismissed = localStorage.getItem(`dismissed-credit-banner-${status}`) === 'true';
      setIsDismissed(dismissed);
    } else {
      setIsDismissed(false);
    }
  }, [status]);

  if (hasUnlimited || noAi || status === 'ok' || isDismissed) {
    return null;
  }

  const exhausted = status === 'exhausted';

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(`dismissed-credit-banner-${status}`, 'true');
  };

  return (
    <div
      className={cn(
        'relative flex flex-col gap-3 border-b px-4 py-3 pr-12 sm:flex-row sm:items-center sm:justify-between sm:pr-14',
        exhausted
          ? 'border-amber-500/30 bg-amber-500/10'
          : 'border-amber-500/25 bg-amber-500/8',
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-amber-600',
            exhausted ? 'bg-amber-500/15' : 'bg-amber-500/12'
          )}
        >
          <Coins className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">
            {exhausted
              ? 'Your AI credits for this period are exhausted.'
              : `Low AI credits — ${formatCreditsExact(metrics.remaining)} remaining (${metrics.pct}% used).`}
          </p>
          <p className="mt-0.5 text-sm text-text-muted">
            {exhausted
              ? 'Contact an admin to request additional AI credits for your account.'
              : 'AI chat may stop soon when credits run out. Request more from billing or an admin.'}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 pl-11 sm:pl-0">
        <Button asChild size="sm" variant="default">
          <Link href="/workspace/profile?tab=billing">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Billing
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <a href={`mailto:${TOKEN_SUPPORT_EMAIL}?subject=Token%20limit%20increase%20request`}>
            <Mail className="mr-1.5 h-3.5 w-3.5" />
            Email admin
          </a>
        </Button>
        {!exhausted ? null : (
          <Button asChild size="sm" variant="outline">
            <a href={TOKEN_SUPPORT_X_URL} target="_blank" rel="noopener noreferrer">
              <ArrowUpRight className="mr-1.5 h-3.5 w-3.5" />
              X / DM
            </a>
          </Button>
        )}
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-3 top-3 sm:top-1/2 sm:-translate-y-1/2 p-1.5 rounded-lg text-amber-800/60 hover:text-amber-800 dark:text-amber-400/60 dark:hover:text-amber-300 hover:bg-amber-500/15 transition-all hover:scale-105 active:scale-95"
        aria-label="Dismiss banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
