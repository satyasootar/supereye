'use client';

import { cn } from '@/lib/utils';
import { formatTokens } from '@/lib/billing/format';
import { hasUnlimitedAiAccess } from '@/lib/billing/constants';

type UsageBarProps = {
  label: string;
  used: number;
  limit: number;
  className?: string;
  compact?: boolean;
};

function usageBarColor(pct: number): string {
  if (pct >= 100) return 'bg-[color:var(--priority-urgent)]';
  if (pct >= 80) return 'bg-amber-500';
  return 'bg-accent-blue';
}

export function UsageBar({ label, used, limit, className, compact }: UsageBarProps) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const remaining = Math.max(0, limit - used);

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
          {label}
        </span>
        <span className="text-[10px] tabular-nums text-text-secondary">
          {formatTokens(used)}
          {!compact && limit > 0 && (
            <span className="text-text-muted"> / {formatTokens(limit)}</span>
          )}
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-bg-overlay"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${pct}% used`}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-500', usageBarColor(pct))}
          style={{ width: `${pct}%` }}
        />
      </div>
      {!compact && limit > 0 && (
        <p className="text-[10px] text-text-muted">{formatTokens(remaining)} remaining</p>
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
  aiTokensThisPeriod?: number;
  effectiveLimit?: number;
  compact?: boolean;
  className?: string;
};

export function WalletUsageSummary({
  wallet,
  role,
  aiTokensThisPeriod = 0,
  effectiveLimit,
  compact,
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
        <p className="text-[10px] font-medium text-accent-blue">Unlimited AI usage</p>
      </div>
    );
  }

  const limit =
    effectiveLimit ??
    wallet.monthlyAllocation + (wallet.bonusAllocation ?? 0);
  const creditsUsed = wallet.usedThisPeriod ?? 0;

  return (
    <div className={cn('space-y-2.5 rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface/60 px-2.5 py-2.5', className)}>
      <UsageBar label="Plan credits" used={creditsUsed} limit={limit} compact={compact} />
      <UsageBar
        label="AI tokens"
        used={aiTokensThisPeriod}
        limit={Math.max(limit, aiTokensThisPeriod, 1)}
        compact={compact}
      />
    </div>
  );
}
