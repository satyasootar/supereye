import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTokenWallet } from '@/lib/billing/tokens';
import { getUserSubscription } from '@/lib/billing/admin';
import { listTopUpPacks } from '@/lib/billing/plans';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
