import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/billing/api-auth';
import { listInvoices } from '@/lib/billing/plans';
import { parseQuery } from '@/lib/validation/http';
import { adminBillingQuerySchema } from '@/lib/validation/admin';

export async function GET(req: Request) {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const parsed = parseQuery(req.url, adminBillingQuerySchema);
  if ('error' in parsed) return parsed.error;

  const { search, status, limit, offset } = parsed.data;
  const invoices = await listInvoices({ search, status, limit, offset });

  return NextResponse.json({ invoices });
}
