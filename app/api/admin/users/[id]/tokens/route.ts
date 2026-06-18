import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/billing/api-auth';
import { adjustTokens, resetPeriodTokens } from '@/lib/billing/tokens';
import { parseJsonBody } from '@/lib/validation/http';
import { adminTokenPostSchema } from '@/lib/validation/admin';
import { uuidSchema } from '@/lib/validation/common';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: RouteContext) {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const { id } = await context.params;
  if (!uuidSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
  }

  const parsed = await parseJsonBody(req, adminTokenPostSchema);
  if ('error' in parsed) return parsed.error;
  const body = parsed.data;

  if ('monthlyAllocation' in body) {
    await resetPeriodTokens(id, body.monthlyAllocation, authResult.admin.id);
    return NextResponse.json({ ok: true });
  }

  const ledgerAction =
    body.action === 'remove'
      ? 'admin_removal'
      : body.action === 'bonus'
        ? 'bonus_credits'
        : 'admin_allocation';

  const result = await adjustTokens({
    userId: id,
    amount: body.action === 'remove' ? -body.amount : body.amount,
    action: ledgerAction,
    reason: body.reason,
    adminUserId: authResult.admin.id,
  });

  return NextResponse.json(result);
}
