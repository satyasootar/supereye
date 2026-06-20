import { NextResponse } from 'next/server';
import { requireAdminSession, requireSuperAdminSession } from '@/lib/billing/api-auth';
import {
  listEnterpriseAccounts,
  createEnterpriseAccount,
} from '@/lib/billing/plans';
import { parseJsonBody } from '@/lib/validation/http';
import { adminEnterpriseCreateSchema } from '@/lib/validation/admin';

export async function GET() {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const accounts = await listEnterpriseAccounts();
  return NextResponse.json({ accounts });
}

export async function POST(req: Request) {
  const authResult = await requireSuperAdminSession();
  if ('error' in authResult) return authResult.error;

  const parsed = await parseJsonBody(req, adminEnterpriseCreateSchema);
  if ('error' in parsed) return parsed.error;

  const result = await createEnterpriseAccount({
    ...parsed.data,
    adminUserId: authResult.admin.id,
  });
  return NextResponse.json(result);
}
