import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import {
  BillingRequestError,
  createCreditTopUpRequest,
  createSubscriptionChangeRequest,
  listUserBillingRequests,
} from '@/lib/billing/requests';
import { parseJsonBody } from '@/lib/validation/http';
import { billingRequestSchema } from '@/lib/validation/billing';

export async function GET() {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;

  const { requests } = await listUserBillingRequests(authResult.session.user.id);
  return NextResponse.json({ requests });
}

export async function POST(req: Request) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;

  const parsed = await parseJsonBody(req, billingRequestSchema);
  if ('error' in parsed) return parsed.error;

  try {
    if (parsed.data.type === 'credit_top_up') {
      const request = await createCreditTopUpRequest(
        authResult.session.user.id,
        parsed.data.packId,
        parsed.data.note
      );
      return NextResponse.json({ request }, { status: 201 });
    }

    const request = await createSubscriptionChangeRequest(
      authResult.session.user.id,
      parsed.data.planId,
      parsed.data.note
    );
    return NextResponse.json({ request }, { status: 201 });
  } catch (e) {
    if (e instanceof BillingRequestError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    const msg = e instanceof Error ? e.message : 'Failed to submit request';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
