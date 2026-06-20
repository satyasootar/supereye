'use client';

import { formatCredits } from '@/lib/billing/format';
import { useBillingWallet } from '@/hooks/use-billing-wallet';
import {
  hasUnlimitedAiAccess,
} from '@/lib/billing/constants';

/** @deprecated Use CreditStatusBanner — kept for TokenBalancePill */
export { CreditStatusBanner as TokenExhaustedBanner } from '@/components/billing/credit-status-banner';

export function TokenBalancePill() {
  const { data } = useBillingWallet();

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
      {formatCredits(data.wallet.balance)} credits
    </span>
  );
}
