import { NextResponse } from 'next/server';
import { requireAdminSession, requireSuperAdminSession } from '@/lib/billing/api-auth';
import { adjustTokens, resetPeriodTokens } from '@/lib/billing/tokens';
import {
  assertCanModifyTargetUser,
  getUserRole,
  hasSuperAdminRole,
} from '@/lib/billing/rbac';
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

  const targetRole = await getUserRole(id);
  try {
    assertCanModifyTargetUser({
      actorRole: authResult.admin.role,
      targetRole,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const parsed = await parseJsonBody(req, adminTokenPostSchema);
  if ('error' in parsed) return parsed.error;
  const body = parsed.data;

  const isSuperAdmin = hasSuperAdminRole(authResult.admin.role);

  if ('monthlyAllocation' in body) {
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Only super admins can reset monthly allocation' },
        { status: 403 }
      );
    }
    await resetPeriodTokens(id, body.monthlyAllocation, authResult.admin.id);
    return NextResponse.json({ ok: true });
  }

  const action = body.action ?? 'add';
  const isRemoval = action === 'remove';

  if (!isRemoval && !isSuperAdmin) {
    return NextResponse.json(
      { error: 'Only super admins can increase token allocation' },
      { status: 403 }
    );
  }

  const ledgerAction =
    action === 'remove'
      ? 'admin_removal'
      : action === 'bonus'
        ? 'bonus_credits'
        : 'admin_allocation';

  const result = await adjustTokens({
    userId: id,
    amount: isRemoval ? -body.amount : body.amount,
    action: ledgerAction,
    reason: body.reason,
    adminUserId: authResult.admin.id,
  });

  return NextResponse.json(result);
}
