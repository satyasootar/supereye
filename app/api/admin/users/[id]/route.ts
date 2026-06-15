import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/billing/api-auth';
import {
  getUserDetailForAdmin,
  updateUserAdmin,
  deleteUserAdmin,
} from '@/lib/billing/plans';
import { suspendUser, activateUser } from '@/lib/billing/admin';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const { id } = await context.params;
  const detail = await getUserDetailForAdmin(id);
  if (!detail) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  return NextResponse.json(detail);
}

export async function PATCH(req: Request, context: RouteContext) {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const { id } = await context.params;
  const body = await req.json();

  if (body.action === 'suspend') {
    await suspendUser(id, authResult.admin.id);
    return NextResponse.json({ ok: true });
  }
  if (body.action === 'activate') {
    await activateUser(id, authResult.admin.id);
    return NextResponse.json({ ok: true });
  }

  const updated = await updateUserAdmin(
    id,
    { role: body.role, name: body.name },
    authResult.admin.id
  );
  return NextResponse.json({ user: updated });
}

export async function DELETE(_req: Request, context: RouteContext) {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const { id } = await context.params;
  if (id === authResult.admin.id) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
  }
  await deleteUserAdmin(id, authResult.admin.id);
  return NextResponse.json({ ok: true });
}
