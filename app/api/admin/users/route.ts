import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/billing/api-auth';
import { listAdminUsersWithMonitoring } from '@/lib/monitoring/activity';
import { parseQuery } from '@/lib/validation/http';
import { adminUsersQuerySchema } from '@/lib/validation/admin';

export async function GET(req: Request) {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const parsed = parseQuery(req.url, adminUsersQuerySchema);
  if ('error' in parsed) return parsed.error;

  const { search } = parsed.data;
  const users = await listAdminUsersWithMonitoring({ search });

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const summary = {
    onlineNow: users.filter((u) => u.isOnline).length,
    totalUsers: users.length,
    activeToday: users.filter((u) => {
      if (!u.lastSeenAt) return false;
      return Date.parse(u.lastSeenAt) >= startOfDay.getTime();
    }).length,
    totalTokensUsedThisPeriod: users.reduce((sum, u) => sum + (u.usedThisPeriod ?? 0), 0),
  };

  return NextResponse.json({ users, summary, callerRole: authResult.admin.role });
}
