'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowUpRight, Coins, Mail, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatTokens } from '@/lib/billing/format';
import {
  hasUnlimitedAiAccess,
  TOKEN_SUPPORT_EMAIL,
  TOKEN_SUPPORT_X_URL,
} from '@/lib/billing/constants';

type WalletResponse = {
  wallet: {
    balance: number;
    monthlyAllocation: number;
    usedThisPeriod: number;
    unlimited: boolean;
  } | null;
  role: string;
};

export function TokenExhaustedBanner({ className }: { className?: string }) {
  const { data } = useQuery<WalletResponse>({
    queryKey: ['billing-wallet'],
    queryFn: async () => {
      const res = await fetch('/api/billing/wallet');
      if (!res.ok) throw new Error('Failed to load wallet');
      return res.json();
    },
    refetchInterval: 60_000,
  });

  if (!data || hasUnlimitedAiAccess(data.role) || data.wallet?.unlimited) return null;

  const balance = data.wallet?.balance ?? 0;
  if (balance > 0) return null;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600">
          <Coins className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">
            Your monthly token limit has been exhausted.
          </p>
          <p className="mt-0.5 text-sm text-text-muted">
            Contact an admin to request additional tokens for your account.
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
        <Button asChild size="sm" variant="outline">
          <a href={TOKEN_SUPPORT_X_URL} target="_blank" rel="noopener noreferrer">
            <ArrowUpRight className="mr-1.5 h-3.5 w-3.5" />
            X / DM
          </a>
        </Button>
      </div>
    </div>
  );
}

export function TokenBalancePill() {
  const { data } = useQuery<WalletResponse>({
    queryKey: ['billing-wallet'],
    queryFn: async () => {
      const res = await fetch('/api/billing/wallet');
      if (!res.ok) throw new Error('Failed to load wallet');
      return res.json();
    },
    refetchInterval: 60_000,
  });

  if (!data?.wallet) return null;
  if (data.wallet.unlimited || hasUnlimitedAiAccess(data.role)) {
    return (
      <span className="rounded-full border border-accent-blue/30 bg-accent-blue/10 px-2 py-0.5 text-[11px] font-medium text-accent-blue">
        Unlimited
      </span>
    );
  }

  return (
    <span className="rounded-full border border-border-default bg-bg-surface px-2 py-0.5 text-[11px] text-text-muted">
      {formatTokens(data.wallet.balance)} tokens
    </span>
  );
}
