import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { purchaseTopUpPack } from '@/lib/billing/plans';
import { TokenExhaustedError } from '@/lib/billing/tokens';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { packId } = await req.json();
  if (!packId) {
    return NextResponse.json({ error: 'packId required' }, { status: 400 });
  }

  try {
    const result = await purchaseTopUpPack(session.user.id, packId);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Purchase failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export { TokenExhaustedError };
