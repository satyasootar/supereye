import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/billing/api-auth';
import { listUsersForAdmin } from '@/lib/billing/admin';

export async function GET(req: Request) {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') ?? undefined;
  const limit = Number(searchParams.get('limit') ?? 50);
  const offset = Number(searchParams.get('offset') ?? 0);

  const users = await listUsersForAdmin({ search, limit, offset });
  return NextResponse.json({ users });
}
