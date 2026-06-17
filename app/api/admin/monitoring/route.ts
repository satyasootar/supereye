import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/billing/api-auth';
import { getAdminMonitoringUsers } from '@/lib/monitoring/activity';

export async function GET() {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const users = await getAdminMonitoringUsers();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const summary = {
    onlineNow: users.filter((u) => u.isOnline).length,
    totalUsers: users.length,
    activeToday: users.filter((u) => {
      if (!u.lastSeenAt) return false;
      return Date.parse(u.lastSeenAt) >= startOfDay.getTime();
    }).length,
    totalTokensUsedThisPeriod: users.reduce((sum, u) => sum + u.tokensUsedThisPeriod, 0),
  };

  return NextResponse.json({ users, summary });
}
