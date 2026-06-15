import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/billing/api-auth';
import { listAuditLogs } from '@/lib/billing/plans';

export async function GET(req: Request) {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const { searchParams } = new URL(req.url);
  const logs = await listAuditLogs({
    limit: Number(searchParams.get('limit') ?? 100),
    offset: Number(searchParams.get('offset') ?? 0),
  });
  return NextResponse.json({ logs });
}
