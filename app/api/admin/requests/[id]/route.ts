import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/billing/api-auth';
import {
  approveBillingRequest,
  BillingRequestError,
  rejectBillingRequest,
} from '@/lib/billing/requests';
import { parseJsonBody } from '@/lib/validation/http';
import { adminBillingRequestActionSchema } from '@/lib/validation/billing';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const { id } = await context.params;
  const parsed = await parseJsonBody(req, adminBillingRequestActionSchema);
  if ('error' in parsed) return parsed.error;

  try {
    const request =
      parsed.data.action === 'approve'
        ? await approveBillingRequest(id, authResult.session.user.id, parsed.data.adminNote)
        : await rejectBillingRequest(id, authResult.session.user.id, parsed.data.adminNote);

    return NextResponse.json({ request });
  } catch (e) {
    if (e instanceof BillingRequestError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    const msg = e instanceof Error ? e.message : 'Failed to process request';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
