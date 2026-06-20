/** Pure wallet math — safe to import from client components. */

export function getEffectiveTokenLimit(wallet: {
  monthlyAllocation: number;
  bonusAllocation?: number;
}): number {
  return wallet.monthlyAllocation + (wallet.bonusAllocation ?? 0);
}

export function getRemainingTokenAllowance(wallet: {
  monthlyAllocation: number;
  bonusAllocation?: number;
  usedThisPeriod: number;
  balance: number;
}): number {
  const effectiveLimit = getEffectiveTokenLimit(wallet);
  const fromUsage = Math.max(0, effectiveLimit - wallet.usedThisPeriod);
  return Math.min(wallet.balance, fromUsage);
}

export type WalletSnapshot = {
  balance: number;
  monthlyAllocation: number;
  bonusAllocation?: number;
  usedThisPeriod: number;
  unlimited?: boolean;
};

export type WalletDisplayMetrics = {
  effectiveLimit: number;
  remaining: number;
  used: number;
  pct: number;
};

export function getWalletDisplayMetrics(wallet: WalletSnapshot): WalletDisplayMetrics {
  const effectiveLimit = getEffectiveTokenLimit(wallet);
  const remaining = getRemainingTokenAllowance(wallet);
  const used = wallet.usedThisPeriod ?? 0;
  const rawPct = effectiveLimit > 0 ? (used / effectiveLimit) * 100 : 0;
  let pct =
    effectiveLimit > 0
      ? remaining > 0 && rawPct < 100
        ? Math.min(99, Math.floor(rawPct))
        : Math.min(100, Math.round(rawPct))
      : 0;

  return { effectiveLimit, remaining, used, pct };
}

export type CreditStatus = 'ok' | 'low' | 'exhausted';

export function getCreditStatus(metrics: Pick<WalletDisplayMetrics, 'remaining' | 'pct'>): CreditStatus {
  if (metrics.remaining <= 0) return 'exhausted';
  if (metrics.pct >= 80) return 'low';
  return 'ok';
}
