import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { getTokenWallet, ensureWalletPeriodFresh, getEffectiveTokenLimit } from '@/lib/billing/tokens';
import { getUserSubscription } from '@/lib/billing/admin';
import { listTopUpPacks } from '@/lib/billing/plans';
import { getAiTokensUsedSince } from '@/lib/usage/ai-tokens-period';

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

  const aiTokensThisPeriod = wallet
    ? await getAiTokensUsedSince(session.user.id, wallet.periodStart)
    : 0;

  const effectiveLimit = wallet
    ? getEffectiveTokenLimit({
        monthlyAllocation: wallet.monthlyAllocation,
        bonusAllocation: wallet.bonusAllocation ?? 0,
      })
    : 0;

  return NextResponse.json({
    wallet,
    subscription,
    packs,
    role: session.user.role,
    usage: {
      aiTokensThisPeriod,
      effectiveLimit,
    },
  });
}
