'use client';

import { cn } from '@/lib/utils';
import { formatCreditsExact, formatUsagePercent } from '@/lib/billing/format';
import { hasUnlimitedAiAccess } from '@/lib/billing/constants';
import {
  getCreditStatus,
  getWalletDisplayMetrics,
  type WalletDisplayMetrics,
} from '@/lib/billing/wallet-math';

type UsageBarProps = {
  label: string;
  metrics: WalletDisplayMetrics;
  className?: string;
  compact?: boolean;
  showRemaining?: boolean;
  showPercent?: boolean;
  trailingAction?: React.ReactNode;
};

function usageBarColor(pct: number): string {
  if (pct >= 100) return 'bg-[color:var(--priority-urgent)]';
  if (pct >= 80) return 'bg-amber-500';
  return 'bg-accent-blue';
}

export function UsageBar({
  label,
  metrics,
  className,
  compact,
  showRemaining = true,
  showPercent = true,
  trailingAction,
}: UsageBarProps) {
  const { effectiveLimit: limit, remaining, used, pct } = metrics;

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] tabular-nums text-text-secondary">
            {showRemaining ? (
              <>
                {formatCreditsExact(remaining)} left
                {showPercent && limit > 0 ? (
                  <span className="text-text-muted"> · {formatUsagePercent(pct)} used</span>
                ) : null}
              </>
            ) : (
              <>
                {formatCreditsExact(used)}
                {!compact && limit > 0 && (
                  <span className="text-text-muted"> / {formatCreditsExact(limit)}</span>
                )}
                {showPercent && limit > 0 ? (
                  <span className="text-text-muted"> · {formatUsagePercent(pct)} used</span>
                ) : null}
              </>
            )}
          </span>
          {trailingAction}
        </div>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-bg-overlay"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${formatUsagePercent(pct)} used, ${formatCreditsExact(remaining)} remaining`}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-500', usageBarColor(pct))}
          style={{ width: `${pct > 0 ? Math.max(pct, 2) : 0}%` }}
        />
      </div>
      {!compact && !showRemaining && limit > 0 && (
        <p className="text-[10px] text-text-muted">
          {formatCreditsExact(remaining)} remaining
        </p>
      )}
    </div>
  );
}

type WalletUsageSummaryProps = {
  wallet: {
    balance: number;
    monthlyAllocation: number;
    bonusAllocation?: number;
    usedThisPeriod: number;
    unlimited: boolean;
  } | null;
  role: string;
  compact?: boolean;
  showRemaining?: boolean;
  showPercent?: boolean;
  headerAction?: React.ReactNode;
  className?: string;
};

/** User-facing credits summary — no LLM token metrics */
export function WalletUsageSummary({
  wallet,
  role,
  compact,
  showRemaining,
  showPercent = true,
  headerAction,
  className,
}: WalletUsageSummaryProps) {
  if (!wallet) return null;

  if (wallet.unlimited || hasUnlimitedAiAccess(role)) {
    return (
      <div
        className={cn(
          'rounded-[var(--radius-md)] border border-accent-blue/25 bg-accent-blue/8 px-2.5 py-2',
          className
        )}
      >
        <p className="text-[10px] font-medium text-accent-blue">Unlimited AI credits</p>
      </div>
    );
  }

  const metrics = getWalletDisplayMetrics({
    balance: wallet.balance,
    monthlyAllocation: wallet.monthlyAllocation,
    bonusAllocation: wallet.bonusAllocation,
    usedThisPeriod: wallet.usedThisPeriod,
  });
  const status = getCreditStatus(metrics);

  if (metrics.effectiveLimit <= 0) {
    return (
      <div
        className={cn(
          'rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface/60 px-2.5 py-2',
          className
        )}
      >
        <p className="text-[10px] text-text-muted">No AI credits on this plan</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] border bg-bg-surface/60 px-2.5 py-2.5',
        status === 'exhausted'
          ? 'border-[color:var(--priority-urgent)]/35'
          : status === 'low'
            ? 'border-amber-500/35'
            : 'border-border-subtle',
        className
      )}
    >
      <UsageBar
        label="AI Credits"
        metrics={metrics}
        compact={compact}
        showRemaining={showRemaining ?? compact}
        showPercent={showPercent}
        trailingAction={headerAction}
      />
    </div>
  );
}

/** Super-admin only: LLM token consumption (internal cost metric) */
export function AdminLlmTokenUsage({
  aiTokensUsed,
  className,
}: {
  aiTokensUsed: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-dashed border-border-default bg-bg-surface/40 px-3 py-2.5',
        className
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
        LLM tokens (admin only)
      </p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-text-primary">
        {formatCreditsExact(aiTokensUsed)} total consumed
      </p>
      <p className="mt-0.5 text-xs text-text-muted">
        Raw model input/output tokens — not shown to users.
      </p>
    </div>
  );
}
