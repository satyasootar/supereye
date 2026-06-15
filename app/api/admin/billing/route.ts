import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/billing/api-auth';
import { listInvoices } from '@/lib/billing/plans';

export async function GET(req: Request) {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const { searchParams } = new URL(req.url);
  const invoices = await listInvoices({
    search: searchParams.get('search') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    limit: Number(searchParams.get('limit') ?? 50),
    offset: Number(searchParams.get('offset') ?? 0),
  });

  return NextResponse.json({ invoices });
}
