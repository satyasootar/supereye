import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { purchaseTopUpPack } from '@/lib/billing/plans';
import { TokenExhaustedError } from '@/lib/billing/tokens';

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SIMULATED_BILLING !== 'true') {
    return NextResponse.json({ error: 'Billing is not enabled' }, { status: 503 });
  }

  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

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
