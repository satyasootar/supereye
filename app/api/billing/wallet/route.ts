import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import {
  getTokenWallet,
  ensureWalletPeriodFresh,
  getEffectiveTokenLimit,
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

  const plan = subscription?.plan ?? null;

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
          aiEnabled: planIncludesAi(plan),
        }
      : null,
  });
}
