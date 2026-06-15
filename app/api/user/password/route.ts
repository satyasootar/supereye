import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { setUserPassword, userHasPassword } from '@/lib/auth/credentials';

export async function GET() {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;

  const hasPassword = await userHasPassword(authResult.session.user.id);
  return NextResponse.json({ hasPassword });
}

export async function POST(req: Request) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;

  const body = await req.json();
  const newPassword =
    typeof body.newPassword === 'string' ? body.newPassword : '';
  const currentPassword =
    typeof body.currentPassword === 'string' ? body.currentPassword : undefined;

  if (!newPassword) {
    return NextResponse.json({ error: 'New password is required' }, { status: 400 });
  }

  const result = await setUserPassword(
    authResult.session.user.id,
    newPassword,
    currentPassword
  );

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
