import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import {
  getTokenWallet,
  ensureWalletPeriodFresh,
  getEffectiveTokenLimit,
  getRemainingTokenAllowance,
  getActionTokenCost,
} from '@/lib/billing/tokens';
import { getUserSubscription } from '@/lib/billing/admin';
import { listTopUpPacks } from '@/lib/billing/plans';
import { planIncludesAi } from '@/lib/billing/plan-access';

export async function GET() {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const [walletRaw, subscription, packs] = await Promise.all([
    ensureWalletPeriodFresh(session.user.id),
    getUserSubscription(session.user.id),
    listTopUpPacks(),
  ]);
  const wallet = walletRaw ?? (await getTokenWallet(session.user.id));

  const effectiveLimit = wallet
    ? getEffectiveTokenLimit({
        monthlyAllocation: wallet.monthlyAllocation,
        bonusAllocation: wallet.bonusAllocation ?? 0,
      })
    : 0;

  const remainingAllowance = wallet
    ? getRemainingTokenAllowance({
        monthlyAllocation: wallet.monthlyAllocation,
        bonusAllocation: wallet.bonusAllocation ?? 0,
        usedThisPeriod: wallet.usedThisPeriod,
        balance: wallet.balance,
      })
    : 0;

  const plan = subscription?.plan ?? null;

  const [chatCreditCost, agentActionCreditCost] = wallet
    ? await Promise.all([
        getActionTokenCost('ai_chat'),
        getActionTokenCost('ai_agent_action'),
      ])
    : [0, 0];

  return NextResponse.json({
    wallet,
    subscription,
    packs,
    role: session.user.role,
    credits: wallet
      ? {
          balance: wallet.balance,
          usedThisPeriod: wallet.usedThisPeriod,
          monthlyAllocation: wallet.monthlyAllocation,
          bonusAllocation: wallet.bonusAllocation ?? 0,
          effectiveLimit,
          remainingAllowance,
          aiEnabled: planIncludesAi(plan),
          chatCreditCost,
          agentActionCreditCost,
          canAffordChat: remainingAllowance >= chatCreditCost,
          canAffordAgentAction: remainingAllowance >= agentActionCreditCost,
        }
      : null,
  });
}
