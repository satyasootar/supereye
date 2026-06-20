'use client';

import { useQuery } from '@tanstack/react-query';
import { WalletUsageSummary } from '@/components/billing/usage-bar';

type WalletResponse = {
  wallet: {
    balance: number;
    monthlyAllocation: number;
    bonusAllocation?: number;
    usedThisPeriod: number;
    unlimited: boolean;
  } | null;
  role: string;
  credits?: {
    effectiveLimit: number;
    remainingAllowance: number;
    aiEnabled: boolean;
  } | null;
};

export function SidebarUsageBar() {
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

  if (data.credits && !data.credits.aiEnabled) {
    return (
      <div className="rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface/60 px-2.5 py-2">
        <p className="text-[10px] font-medium text-text-muted">Plugins only — no AI on this plan</p>
      </div>
    );
  }

  return (
    <WalletUsageSummary
      wallet={data.wallet}
      role={data.role}
      effectiveLimit={data.credits?.effectiveLimit}
      remainingAllowance={data.credits?.remainingAllowance}
      compact
      showRemaining
    />
  );
}
