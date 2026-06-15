import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/billing/api-auth';
import { getAdminOverviewStats, getPlanAnalytics } from '@/lib/billing/admin';
import { getAnalyticsCharts } from '@/lib/billing/plans';

export async function GET() {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const [overview, planAnalytics, charts] = await Promise.all([
    getAdminOverviewStats(),
    getPlanAnalytics(),
    getAnalyticsCharts(),
  ]);

  return NextResponse.json({ overview, planAnalytics, charts });
}
