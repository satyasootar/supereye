import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  tokenWallets,
  tokenLedger,
  tokenActionCosts,
  subscriptions,
  type ledgerActionEnum,
} from '@/lib/db/schema';
import { getUserRole } from './rbac';
import { hasUnlimitedAiAccess } from './constants';
import { writeAdminAuditLog } from './audit-log';
import { getUserSubscription } from './admin';
import { planIncludesAi } from './plan-access';
import {
  getEffectiveTokenLimit,
  getRemainingTokenAllowance,
} from './wallet-math';

export { getEffectiveTokenLimit, getRemainingTokenAllowance } from './wallet-math';

export class PlanAiDisabledError extends Error {
  status = 403;
  code = 'PLAN_AI_DISABLED';
  constructor(
    message = 'Your plan does not include AI features. Upgrade your plan or purchase credits.'
  ) {
    super(message);
    this.name = 'PlanAiDisabledError';
  }
}

export class TokenExhaustedError extends Error {
  status = 402;
  code = 'TOKEN_EXHAUSTED';
  constructor(message = 'Monthly token limit exhausted') {
    super(message);
    this.name = 'TokenExhaustedError';
  }
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

export async function assertPlanAllowsAi(userId: string) {
  const role = await getUserRole(userId);
  if (hasUnlimitedAiAccess(role)) return;

  const sub = await getUserSubscription(userId);
  if (sub && !planIncludesAi(sub.plan)) {
    throw new PlanAiDisabledError();
  }
}

export async function canUseAi(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  if (hasUnlimitedAiAccess(role)) return true;

  try {
    await assertPlanAllowsAi(userId);
  } catch {
    return false;
  }

  const wallet = await ensureWalletPeriodFresh(userId);
  if (!wallet) return false;
  if (wallet.unlimited) return true;

  return getRemainingTokenAllowance(wallet) > 0;
}

export async function canAffordAiAction(
  userId: string,
  actionKey: string
): Promise<boolean> {
  const role = await getUserRole(userId);
  if (hasUnlimitedAiAccess(role)) return true;

  try {
    await assertPlanAllowsAi(userId);
  } catch {
    return false;
  }

  const wallet = await ensureWalletPeriodFresh(userId);
  if (!wallet || wallet.unlimited) return false;

  const cost = await getActionTokenCost(actionKey);
  if (cost <= 0) return true;

  return getRemainingTokenAllowance(wallet) >= cost;
}

export async function assertCanAffordAiAction(userId: string, actionKey: string) {
  await assertPlanAllowsAi(userId);

  const role = await getUserRole(userId);
  if (hasUnlimitedAiAccess(role)) return;

  const wallet = await ensureWalletPeriodFresh(userId);
  if (!wallet) {
    throw new TokenExhaustedError('No token wallet found');
  }
  if (wallet.unlimited) return;

  const cost = await getActionTokenCost(actionKey);
  if (cost <= 0) return;

  const remaining = getRemainingTokenAllowance(wallet);
  if (remaining < cost) {
    throw new TokenExhaustedError(
      remaining <= 0
        ? 'Your AI credits for this period are exhausted. Request more credits or upgrade your plan.'
        : `This action needs ${cost} credits but you only have ${remaining} remaining. Request more credits or upgrade your plan.`
    );
  }
}

export async function assertCanUseAi(userId: string) {
  await assertPlanAllowsAi(userId);
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

  await assertPlanAllowsAi(params.userId);

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
    : params.action === 'bonus_credits' || params.action === 'admin_allocation'
      ? absAmount
      : 0;

  const newBonusAllocation = Math.max(0, (wallet.bonusAllocation ?? 0) + bonusDelta);

  const newMonthlyAllocation = isRemoval
    ? Math.max(0, wallet.monthlyAllocation - absAmount)
    : wallet.monthlyAllocation;

  const cappedBalance = Math.min(
    newBalance,
    Math.max(0, getEffectiveTokenLimit({
      monthlyAllocation: newMonthlyAllocation,
      bonusAllocation: newBonusAllocation,
    }) - wallet.usedThisPeriod)
  );

  await db
    .update(tokenWallets)
    .set({
      balance: cappedBalance,
      monthlyAllocation: newMonthlyAllocation,
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
    newBalance: cappedBalance,
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

  return {
    previousBalance,
    newBalance: cappedBalance,
    bonusAllocation: newBonusAllocation,
    monthlyAllocation: newMonthlyAllocation,
  };
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
      updatedAt: now,
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

/** Apply a new monthly allocation without resetting the billing period or usage. */
export async function applyMonthlyAllocationUpdate(
  userId: string,
  monthlyAllocation: number
) {
  const wallet = await getTokenWallet(userId);
  if (!wallet || wallet.unlimited) return;

  const effectiveLimit = getEffectiveTokenLimit({
    monthlyAllocation,
    bonusAllocation: wallet.bonusAllocation ?? 0,
  });
  const maxBalance = Math.max(0, effectiveLimit - wallet.usedThisPeriod);
  const newBalance = Math.min(wallet.balance, maxBalance);

  await db
    .update(tokenWallets)
    .set({
      monthlyAllocation,
      balance: newBalance,
      updatedAt: new Date(),
    })
    .where(eq(tokenWallets.userId, userId));
}

export async function syncSubscriberWalletsToPlanTokens(
  planId: string,
  monthlyTokens: number
) {
  const subscribers = await db
    .select({ userId: subscriptions.userId })
    .from(subscriptions)
    .where(
      and(eq(subscriptions.planId, planId), eq(subscriptions.status, 'active'))
    );

  await Promise.all(
    subscribers.map((row) => applyMonthlyAllocationUpdate(row.userId, monthlyTokens))
  );

  return subscribers.length;
}
