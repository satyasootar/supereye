import { NextResponse } from 'next/server';
import { requireAdminSession, requireSuperAdminSession } from '@/lib/billing/api-auth';
import {
  listPlans,
  createEnterprisePlan,
  updatePlan,
} from '@/lib/billing/plans';
import { parseJsonBody } from '@/lib/validation/http';
import {
  adminPlanCreateSchema,
  adminPlanPatchSchema,
} from '@/lib/validation/admin';

export async function GET(req: Request) {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const includeInactive = new URL(req.url).searchParams.get('all') === '1';
  const plans = await listPlans(includeInactive);
  return NextResponse.json({ plans });
}

export async function POST(req: Request) {
  const authResult = await requireSuperAdminSession();
  if ('error' in authResult) return authResult.error;

  const parsed = await parseJsonBody(req, adminPlanCreateSchema);
  if ('error' in parsed) return parsed.error;

  const plan = await createEnterprisePlan(parsed.data, authResult.admin.id);
  return NextResponse.json({ plan });
}

export async function PATCH(req: Request) {
  const authResult = await requireSuperAdminSession();
  if ('error' in authResult) return authResult.error;

  const parsed = await parseJsonBody(req, adminPlanPatchSchema);
  if ('error' in parsed) return parsed.error;

  const { planId, ...data } = parsed.data;
  const plan = await updatePlan(planId, data, authResult.admin.id);
  return NextResponse.json({ plan });
}
