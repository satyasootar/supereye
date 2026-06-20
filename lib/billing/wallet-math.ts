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

export function getWalletDisplayMetrics(wallet: WalletSnapshot) {
  const effectiveLimit = getEffectiveTokenLimit(wallet);
  const remaining = getRemainingTokenAllowance(wallet);
  const used = wallet.usedThisPeriod ?? 0;
  const pct =
    effectiveLimit > 0 ? Math.min(100, Math.round((used / effectiveLimit) * 100)) : 0;

  return { effectiveLimit, remaining, used, pct };
}
