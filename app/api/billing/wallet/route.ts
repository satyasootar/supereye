import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { getTokenWallet } from '@/lib/billing/tokens';
import { getUserSubscription } from '@/lib/billing/admin';
import { listTopUpPacks } from '@/lib/billing/plans';

export async function GET() {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const [wallet, subscription, packs] = await Promise.all([
    getTokenWallet(session.user.id),
    getUserSubscription(session.user.id),
    listTopUpPacks(),
  ]);

  return NextResponse.json({
    wallet,
    subscription,
    packs,
    role: session.user.role,
  });
}
