import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/billing/api-auth';
import { bulkAdjustUserTokens } from '@/lib/billing/bulk-tokens';
import { parseJsonBody } from '@/lib/validation/http';
import { adminBulkTokenSchema } from '@/lib/validation/admin';

export async function POST(req: Request) {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const parsed = await parseJsonBody(req, adminBulkTokenSchema);
  if ('error' in parsed) return parsed.error;

  const body = parsed.data;

  try {
    const result = await bulkAdjustUserTokens({
      adminUserId: authResult.admin.id,
      adminRole: authResult.admin.role,
      userIds: body.userIds,
      action: body.action,
      amount: 'amount' in body ? body.amount : undefined,
      monthlyAllocation: 'monthlyAllocation' in body ? body.monthlyAllocation : undefined,
      reason: body.reason,
    });

    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Bulk update failed';
    const status = msg.includes('super admin') ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
