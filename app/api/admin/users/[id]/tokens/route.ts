import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/billing/api-auth';
import { adjustTokens, resetPeriodTokens } from '@/lib/billing/tokens';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: RouteContext) {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const { id } = await context.params;
  const body = await req.json();
  const { action, amount, reason, monthlyAllocation } = body;

  if (action === 'reset' && typeof monthlyAllocation === 'number') {
    await resetPeriodTokens(id, monthlyAllocation);
    return NextResponse.json({ ok: true });
  }

  if (typeof amount !== 'number' || !reason) {
    return NextResponse.json({ error: 'amount and reason required' }, { status: 400 });
  }

  const ledgerAction =
    action === 'remove'
      ? 'admin_removal'
      : action === 'bonus'
        ? 'bonus_credits'
        : 'admin_allocation';

  const result = await adjustTokens({
    userId: id,
    amount: action === 'remove' ? -Math.abs(amount) : Math.abs(amount),
    action: ledgerAction,
    reason,
    adminUserId: authResult.admin.id,
  });

  return NextResponse.json(result);
}
