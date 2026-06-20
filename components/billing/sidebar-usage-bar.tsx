'use client';

import { WalletUsageSummary } from '@/components/billing/usage-bar';
import { WalletUsageRefreshButton } from '@/components/billing/wallet-refresh-button';
import { useBillingWallet } from '@/hooks/use-billing-wallet';

export function SidebarUsageBar() {
  const { data, refetch, isFetching } = useBillingWallet();

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
      compact
      showRemaining
      showPercent
      headerAction={
        <WalletUsageRefreshButton
          onClick={() => void refetch()}
          isFetching={isFetching}
        />
      }
    />
  );
}
