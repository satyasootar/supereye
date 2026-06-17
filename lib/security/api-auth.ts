import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireActiveUser, AuthorizationError } from '@/lib/billing/rbac';

export async function requireUserSession() {
  const session = await auth();
  if (!session?.user?.id || session.error === 'SessionInvalid') {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { session };
}

export async function requireActiveUserSession() {
  const result = await requireUserSession();
  if ('error' in result) return result;

  try {
    await requireActiveUser(result.session.user.id);
    return result;
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return { error: NextResponse.json({ error: e.message }, { status: 403 }) };
    }
    throw e;
  }
}

export function verifyCronSecret(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== 'production';
  }
  const authHeader = req.headers.get('authorization');
  return authHeader === `Bearer ${secret}`;
}
