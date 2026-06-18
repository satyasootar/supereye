import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/billing/api-auth';
import { listAuditActions, listAuditLogs } from '@/lib/billing/audit-log';
import { parseQuery } from '@/lib/validation/http';
import { adminAuditQuerySchema } from '@/lib/validation/admin';

export async function GET(req: Request) {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const parsed = parseQuery(req.url, adminAuditQuerySchema);
  if ('error' in parsed) return parsed.error;

  const { limit, offset, action, search } = parsed.data;
  const [{ logs, total }, actions] = await Promise.all([
    listAuditLogs({ limit, offset, action, search }),
    listAuditActions(),
  ]);

  return NextResponse.json({ logs, total, actions });
}
