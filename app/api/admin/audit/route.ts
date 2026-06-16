import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/billing/api-auth';
import { listAuditLogs } from '@/lib/billing/plans';
import { parseQuery } from '@/lib/validation/http';
import { adminAuditQuerySchema } from '@/lib/validation/admin';

export async function GET(req: Request) {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const parsed = parseQuery(req.url, adminAuditQuerySchema);
  if ('error' in parsed) return parsed.error;

  const { limit, offset } = parsed.data;
  const logs = await listAuditLogs({ limit, offset });
  return NextResponse.json({ logs });
}
