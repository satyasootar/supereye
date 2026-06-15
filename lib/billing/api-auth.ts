import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireAdmin, AuthorizationError } from '@/lib/billing/rbac';

export async function requireAdminSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  try {
    const admin = await requireAdmin(session.user.id);
    return { session, admin };
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return { error: NextResponse.json({ error: e.message }, { status: 403 }) };
    }
    throw e;
  }
}
