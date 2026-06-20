import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/billing/api-auth';
import { listAdminBillingRequests } from '@/lib/billing/requests';
import { parseQuery } from '@/lib/validation/http';
import { z } from 'zod';
import { paginationQuerySchema } from '@/lib/validation/common';

const adminRequestsQuerySchema = paginationQuerySchema.extend({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled']).optional(),
});

export async function GET(req: Request) {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const parsed = parseQuery(req.url, adminRequestsQuerySchema);
  if ('error' in parsed) return parsed.error;

  const { limit, offset, status } = parsed.data;
  const { requests, total } = await listAdminBillingRequests({ status, limit, offset });

  return NextResponse.json({ requests, total });
}
