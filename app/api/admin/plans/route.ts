import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/billing/api-auth';
import {
  listPlans,
  createEnterprisePlan,
  updatePlan,
} from '@/lib/billing/plans';

export async function GET(req: Request) {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const includeInactive = new URL(req.url).searchParams.get('all') === '1';
  const plans = await listPlans(includeInactive);
  return NextResponse.json({ plans });
}

export async function POST(req: Request) {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const body = await req.json();
  const plan = await createEnterprisePlan(body, authResult.admin.id);
  return NextResponse.json({ plan });
}

export async function PATCH(req: Request) {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const body = await req.json();
  const { planId, ...data } = body;
  if (!planId) {
    return NextResponse.json({ error: 'planId required' }, { status: 400 });
  }
  const plan = await updatePlan(planId, data, authResult.admin.id);
  return NextResponse.json({ plan });
}
