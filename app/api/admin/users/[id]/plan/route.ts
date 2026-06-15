import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/billing/api-auth';
import { assignPlanToUser } from '@/lib/billing/admin';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: RouteContext) {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const { id } = await context.params;
  const { planId } = await req.json();
  if (!planId) {
    return NextResponse.json({ error: 'planId required' }, { status: 400 });
  }

  const plan = await assignPlanToUser({
    userId: id,
    planId,
    adminUserId: authResult.admin.id,
  });
  return NextResponse.json({ plan });
}
