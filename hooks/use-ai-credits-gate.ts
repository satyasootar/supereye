'use client';

import { useBillingWallet } from '@/hooks/use-billing-wallet';
import { hasUnlimitedAiAccess } from '@/lib/billing/constants';

export function useAiCreditsGate() {
  const { data, isLoading } = useBillingWallet();

  const unlimited = hasUnlimitedAiAccess(data?.role) || data?.wallet?.unlimited;
  const aiEnabled = data?.credits?.aiEnabled ?? true;
  const remaining = data?.credits?.remainingAllowance ?? 0;
  const chatCost = data?.credits?.chatCreditCost ?? 100;
  const canAffordChat = unlimited || (data?.credits?.canAffordChat ?? false);
  const canAffordAgentAction = unlimited || (data?.credits?.canAffordAgentAction ?? false);

  const blocked =
    !isLoading && !unlimited && (!aiEnabled || !canAffordChat);

  const agentActionBlocked =
    !isLoading && !unlimited && (!aiEnabled || !canAffordAgentAction);

  return {
    isLoading,
    unlimited,
    aiEnabled,
    blocked,
    agentActionBlocked,
    exhausted: !unlimited && remaining <= 0,
    insufficient: !unlimited && remaining > 0 && remaining < chatCost,
    remaining,
    chatCost,
    canAffordChat,
    canAffordAgentAction,
  };
}
