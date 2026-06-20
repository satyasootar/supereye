import { NextResponse } from 'next/server';
import { requireAdminSession, requireSuperAdminSession } from '@/lib/billing/api-auth';
import {
  listTokenActionCosts,
  updateTokenActionCost,
  listAllTopUpPacks,
  updateTopUpPack,
  listTokenLedger,
} from '@/lib/billing/plans';
import { parseJsonBody, parseQuery } from '@/lib/validation/http';
import { adminTokenPatchSchema, adminTokenQuerySchema } from '@/lib/validation/admin';

export async function GET(req: Request) {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const parsed = parseQuery(req.url, adminTokenQuerySchema);
  if ('error' in parsed) return parsed.error;

  const { type, userId } = parsed.data;

  if (type === 'ledger') {
    const ledger = await listTokenLedger({ userId });
    return NextResponse.json({ ledger });
  }
  if (type === 'packs') {
    const packs = await listAllTopUpPacks();
    return NextResponse.json({ packs });
  }

  const costs = await listTokenActionCosts();
  return NextResponse.json({ costs });
}

export async function PATCH(req: Request) {
  const authResult = await requireSuperAdminSession();
  if ('error' in authResult) return authResult.error;

  const parsed = await parseJsonBody(req, adminTokenPatchSchema);
  if ('error' in parsed) return parsed.error;

  const body = parsed.data;

  if (body.type === 'pack') {
    const { type: _type, id, ...data } = body;
    const pack = await updateTopUpPack(id, data, authResult.admin.id);
    return NextResponse.json({ pack });
  }

  const { type: _type, id, ...data } = body;
  const cost = await updateTokenActionCost(id, data, authResult.admin.id);
  return NextResponse.json({ cost });
}
