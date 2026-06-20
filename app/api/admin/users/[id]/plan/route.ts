import { NextResponse } from 'next/server';
import { requireSuperAdminSession } from '@/lib/billing/api-auth';
import { assignPlanToUser } from '@/lib/billing/admin';
import { parseJsonBody } from '@/lib/validation/http';
import { adminAssignPlanSchema } from '@/lib/validation/admin';
import { uuidSchema } from '@/lib/validation/common';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: RouteContext) {
  const authResult = await requireSuperAdminSession();
  if ('error' in authResult) return authResult.error;

  const { id } = await context.params;
  if (!uuidSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
  }

  const parsed = await parseJsonBody(req, adminAssignPlanSchema);
  if ('error' in parsed) return parsed.error;

  const plan = await assignPlanToUser({
    userId: id,
    planId: parsed.data.planId,
    adminUserId: authResult.admin.id,
  });
  return NextResponse.json({ plan });
}
