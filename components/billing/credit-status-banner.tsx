'use client';

import Link from 'next/link';
import { ArrowUpRight, Coins, Mail, Sparkles } from 'lucide-react';
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

  if (!data?.wallet || hasUnlimitedAiAccess(data.role) || data.wallet.unlimited) {
    return null;
  }

  if (data.credits && !data.credits.aiEnabled) return null;

  const metrics = getWalletDisplayMetrics({
    balance: data.wallet.balance,
    monthlyAllocation: data.wallet.monthlyAllocation,
    bonusAllocation: data.wallet.bonusAllocation,
    usedThisPeriod: data.wallet.usedThisPeriod,
  });
  const status = getCreditStatus(metrics);

  if (status === 'ok') return null;

  const exhausted = status === 'exhausted';

  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
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
    </div>
  );
}
