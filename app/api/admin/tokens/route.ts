import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/billing/api-auth';
import {
  listTokenActionCosts,
  updateTokenActionCost,
  listAllTopUpPacks,
  updateTopUpPack,
  listTokenLedger,
} from '@/lib/billing/plans';

export async function GET(req: Request) {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const type = new URL(req.url).searchParams.get('type') ?? 'costs';

  if (type === 'ledger') {
    const userId = new URL(req.url).searchParams.get('userId') ?? undefined;
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
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const body = await req.json();
  const { type, id, ...data } = body;

  if (type === 'pack') {
    const pack = await updateTopUpPack(id, data, authResult.admin.id);
    return NextResponse.json({ pack });
  }

  const cost = await updateTokenActionCost(id, data, authResult.admin.id);
  return NextResponse.json({ cost });
}
