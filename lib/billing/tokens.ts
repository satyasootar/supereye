import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  tokenWallets,
  tokenLedger,
  tokenActionCosts,
  type ledgerActionEnum,
} from '@/lib/db/schema';
import { getUserRole } from './rbac';
import { hasUnlimitedAiAccess } from './constants';
import { writeAdminAuditLog } from './audit-log';

export class TokenExhaustedError extends Error {
  status = 402;
  code = 'TOKEN_EXHAUSTED';
  constructor(message = 'Monthly token limit exhausted') {
    super(message);
    this.name = 'TokenExhaustedError';
  }
}

export function getEffectiveTokenLimit(wallet: {
  monthlyAllocation: number;
  bonusAllocation: number;
}): number {
  return wallet.monthlyAllocation + (wallet.bonusAllocation ?? 0);
}

export function getRemainingTokenAllowance(wallet: {
  monthlyAllocation: number;
  bonusAllocation: number;
  usedThisPeriod: number;
  balance: number;
}): number {
  const effectiveLimit = getEffectiveTokenLimit(wallet);
  const fromUsage = Math.max(0, effectiveLimit - wallet.usedThisPeriod);
  return Math.min(wallet.balance, fromUsage);
}

export async function getTokenWallet(userId: string) {
  const [wallet] = await db
    .select()
    .from(tokenWallets)
    .where(eq(tokenWallets.userId, userId))
    .limit(1);
  return wallet ?? null;
}

export async function getActionTokenCost(actionKey: string): Promise<number> {
  const [row] = await db
    .select({ tokenCost: tokenActionCosts.tokenCost })
    .from(tokenActionCosts)
    .where(eq(tokenActionCosts.actionKey, actionKey))
    .limit(1);
  return row?.tokenCost ?? 0;
}

/** Reset wallet when billing period has expired */
export async function ensureWalletPeriodFresh(userId: string) {
  const wallet = await getTokenWallet(userId);
  if (!wallet || wallet.unlimited) return wallet;

  if (!wallet.periodEnd || wallet.periodEnd.getTime() > Date.now()) {
    return wallet;
  }

  await resetPeriodTokens(userId, wallet.monthlyAllocation);
  return getTokenWallet(userId);
}

export async function canUseAi(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  if (hasUnlimitedAiAccess(role)) return true;

  const wallet = await ensureWalletPeriodFresh(userId);
  if (!wallet) return false;
  if (wallet.unlimited) return true;

  return getRemainingTokenAllowance(wallet) > 0;
}

export async function assertCanUseAi(userId: string) {
  const allowed = await canUseAi(userId);
  if (!allowed) {
    throw new TokenExhaustedError(
      'Your monthly token limit has been exhausted. Contact an admin to request additional tokens.'
    );
  }
}

type LedgerAction = (typeof ledgerActionEnum)[number];

async function writeLedgerEntry(params: {
  userId: string;
  action: LedgerAction;
  tokensAdded: number;
  tokensRemoved: number;
  previousBalance: number;
  newBalance: number;
  reason?: string;
  referenceType?: string;
  referenceId?: string;
  adminUserId?: string;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(tokenLedger).values({
    userId: params.userId,
    action: params.action,
    tokensAdded: params.tokensAdded,
    tokensRemoved: params.tokensRemoved,
    previousBalance: params.previousBalance,
    newBalance: params.newBalance,
    reason: params.reason ?? null,
    referenceType: params.referenceType ?? null,
    referenceId: params.referenceId ?? null,
    adminUserId: params.adminUserId ?? null,
    metadata: params.metadata ?? null,
  });
}

export async function consumeTokens(params: {
  userId: string;
  actionKey: string;
  reason?: string;
  referenceType?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
}) {
  const role = await getUserRole(params.userId);
  if (hasUnlimitedAiAccess(role)) return { consumed: 0, unlimited: true };

  const wallet = await ensureWalletPeriodFresh(params.userId);
  if (!wallet) throw new TokenExhaustedError('No token wallet found');
  if (wallet.unlimited) return { consumed: 0, unlimited: true };

  const cost = await getActionTokenCost(params.actionKey);
  if (cost <= 0) return { consumed: 0, unlimited: false };

  const effectiveLimit = getEffectiveTokenLimit(wallet);
  if (wallet.usedThisPeriod + cost > effectiveLimit) {
    throw new TokenExhaustedError();
  }

  if (wallet.balance < cost) {
    throw new TokenExhaustedError();
  }

  const previousBalance = wallet.balance;
  const newBalance = previousBalance - cost;

  await db
    .update(tokenWallets)
    .set({
      balance: newBalance,
      usedThisPeriod: wallet.usedThisPeriod + cost,
      updatedAt: new Date(),
    })
    .where(eq(tokenWallets.userId, params.userId));

  await writeLedgerEntry({
    userId: params.userId,
    action: 'ai_usage',
    tokensAdded: 0,
    tokensRemoved: cost,
    previousBalance,
    newBalance,
    reason: params.reason ?? `AI usage: ${params.actionKey}`,
    referenceType: params.referenceType ?? 'ai_action',
    referenceId: params.referenceId ?? params.actionKey,
    metadata: params.metadata,
  });

  return { consumed: cost, unlimited: false, balance: newBalance };
}

export async function adjustTokens(params: {
  userId: string;
  amount: number;
  action: 'admin_allocation' | 'admin_removal' | 'bonus_credits' | 'token_purchase' | 'plan_renewal' | 'period_reset';
  reason: string;
  adminUserId?: string;
  metadata?: Record<string, unknown>;
}) {
  const wallet = await getTokenWallet(params.userId);
  if (!wallet) throw new Error('Wallet not found');

  const previousBalance = wallet.balance;
  const isRemoval = params.amount < 0;
  const absAmount = Math.abs(params.amount);
  const newBalance = isRemoval
    ? Math.max(0, previousBalance - absAmount)
    : previousBalance + absAmount;

  const bonusDelta = isRemoval
    ? -Math.min(absAmount, wallet.bonusAllocation ?? 0)
    : absAmount;

  const newBonusAllocation = Math.max(0, (wallet.bonusAllocation ?? 0) + bonusDelta);

  await db
    .update(tokenWallets)
    .set({
      balance: newBalance,
      bonusAllocation: newBonusAllocation,
      updatedAt: new Date(),
    })
    .where(eq(tokenWallets.userId, params.userId));

  await writeLedgerEntry({
    userId: params.userId,
    action: params.action,
    tokensAdded: isRemoval ? 0 : absAmount,
    tokensRemoved: isRemoval ? absAmount : 0,
    previousBalance,
    newBalance,
    reason: params.reason,
    adminUserId: params.adminUserId,
    metadata: params.metadata,
  });

  if (params.adminUserId) {
    await writeAdminAuditLog({
      adminUserId: params.adminUserId,
      action: params.action,
      targetType: 'user',
      targetId: params.userId,
      metadata: { amount: params.amount, reason: params.reason, ...params.metadata },
    });
  }

  return { previousBalance, newBalance, bonusAllocation: newBonusAllocation };
}

export async function resetPeriodTokens(
  userId: string,
  monthlyAllocation: number,
  adminUserId?: string
) {
  const wallet = await getTokenWallet(userId);
  if (!wallet) return;

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const previousBalance = wallet.balance;
  const newBalance = monthlyAllocation;

  await db
    .update(tokenWallets)
    .set({
      balance: newBalance,
      monthlyAllocation,
      bonusAllocation: 0,
      usedThisPeriod: 0,
      periodStart: now,
      periodEnd,
      updatedAt: new Date(),
    })
    .where(eq(tokenWallets.userId, userId));

  await writeLedgerEntry({
    userId,
    action: 'period_reset',
    tokensAdded: newBalance,
    tokensRemoved: 0,
    previousBalance,
    newBalance,
    reason: adminUserId ? 'Admin token period reset' : 'Monthly plan renewal',
    adminUserId,
  });

  if (adminUserId) {
    await writeAdminAuditLog({
      adminUserId,
      action: 'period_reset',
      targetType: 'user',
      targetId: userId,
      metadata: { monthlyAllocation },
    });
  }
}
