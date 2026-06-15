import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/billing/api-auth';
import {
  listEnterpriseAccounts,
  createEnterpriseAccount,
} from '@/lib/billing/plans';

export async function GET() {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const accounts = await listEnterpriseAccounts();
  return NextResponse.json({ accounts });
}

export async function POST(req: Request) {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const body = await req.json();
  const result = await createEnterpriseAccount({
    ...body,
    adminUserId: authResult.admin.id,
  });
  return NextResponse.json(result);
}
