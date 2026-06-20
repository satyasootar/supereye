'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BILLING_WALLET_QUERY_KEY,
  BILLING_WALLET_REFETCH_MS,
} from '@/lib/billing/wallet-query';

export type BillingWalletResponse = {
  wallet: {
    balance: number;
    monthlyAllocation: number;
    bonusAllocation?: number;
    usedThisPeriod: number;
    unlimited: boolean;
    periodEnd?: string | null;
  } | null;
  subscription: {
    subscription: { status: string; currentPeriodEnd: string };
    plan: { id: string; name: string; priceCents: number; monthlyTokens: number };
  } | null;
  packs: { id: string; name: string; tokenAmount: number; priceCents: number }[];
  role: string;
  credits?: {
    balance: number;
    usedThisPeriod: number;
    monthlyAllocation: number;
    bonusAllocation: number;
    effectiveLimit: number;
    remainingAllowance: number;
    aiEnabled: boolean;
    chatCreditCost: number;
    agentActionCreditCost: number;
    canAffordChat: boolean;
    canAffordAgentAction: boolean;
  } | null;
};

async function fetchBillingWallet(): Promise<BillingWalletResponse> {
  const res = await fetch('/api/billing/wallet', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load wallet');
  return res.json();
}

export function useBillingWallet() {
  return useQuery<BillingWalletResponse>({
    queryKey: BILLING_WALLET_QUERY_KEY,
    queryFn: fetchBillingWallet,
    staleTime: BILLING_WALLET_REFETCH_MS,
    refetchInterval: BILLING_WALLET_REFETCH_MS,
    refetchOnWindowFocus: false,
  });
}

export function invalidateBillingWallet(
  queryClient: ReturnType<typeof useQueryClient>
) {
  return queryClient.invalidateQueries({ queryKey: BILLING_WALLET_QUERY_KEY });
}
