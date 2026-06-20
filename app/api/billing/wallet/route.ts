import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { getTokenWallet, ensureWalletPeriodFresh } from '@/lib/billing/tokens';
import { getUserSubscription } from '@/lib/billing/admin';
import { listTopUpPacks } from '@/lib/billing/plans';

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

  return NextResponse.json({
    wallet,
    subscription,
    packs,
    role: session.user.role,
  });
}
