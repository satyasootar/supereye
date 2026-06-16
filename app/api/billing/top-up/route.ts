import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { purchaseTopUpPack } from '@/lib/billing/plans';
import { TokenExhaustedError } from '@/lib/billing/tokens';
import { parseJsonBody } from '@/lib/validation/http';
import { billingTopUpSchema } from '@/lib/validation/billing';

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SIMULATED_BILLING !== 'true') {
    return NextResponse.json({ error: 'Billing is not enabled' }, { status: 503 });
  }

  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const parsed = await parseJsonBody(req, billingTopUpSchema);
  if ('error' in parsed) return parsed.error;

  try {
    const result = await purchaseTopUpPack(session.user.id, parsed.data.packId);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Purchase failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export { TokenExhaustedError };
