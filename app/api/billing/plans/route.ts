import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { listPlans } from '@/lib/billing/plans';

export async function GET() {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;

  const allPlans = await listPlans(false);
  const plans = allPlans.filter((plan) => !plan.isEnterprise);

  return NextResponse.json({ plans });
}
