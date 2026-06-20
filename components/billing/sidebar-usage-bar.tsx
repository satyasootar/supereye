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
  usage?: {
    aiTokensThisPeriod: number;
    effectiveLimit: number;
  };
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

  return (
    <WalletUsageSummary
      wallet={data.wallet}
      role={data.role}
      aiTokensThisPeriod={data.usage?.aiTokensThisPeriod}
      effectiveLimit={data.usage?.effectiveLimit}
      compact
    />
  );
}
