import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/billing/api-auth';
import { listUsersForAdmin } from '@/lib/billing/admin';
import { parseQuery } from '@/lib/validation/http';
import { adminUsersQuerySchema } from '@/lib/validation/admin';

export async function GET(req: Request) {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const parsed = parseQuery(req.url, adminUsersQuerySchema);
  if ('error' in parsed) return parsed.error;

  const { search, limit, offset } = parsed.data;
  const users = await listUsersForAdmin({ search, limit, offset });
  return NextResponse.json({ users });
}
