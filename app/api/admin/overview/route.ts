import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/billing/api-auth';
import { getAdminOverviewStats, getPlanAnalytics } from '@/lib/billing/admin';
import { getAnalyticsCharts } from '@/lib/billing/plans';
import { countPendingBillingRequests, listAdminBillingRequests } from '@/lib/billing/requests';

export async function GET() {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const [overview, planAnalytics, charts, pendingRequestsCount, pendingRequests] =
    await Promise.all([
      getAdminOverviewStats(),
      getPlanAnalytics(),
      getAnalyticsCharts(),
      countPendingBillingRequests(),
      listAdminBillingRequests({ status: 'pending', limit: 5 }),
    ]);

  return NextResponse.json({
    overview,
    planAnalytics,
    charts,
    pendingRequestsCount,
    pendingRequests: pendingRequests.requests,
  });
}
