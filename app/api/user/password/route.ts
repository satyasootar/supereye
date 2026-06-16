import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { setUserPassword, userHasPassword } from '@/lib/auth/credentials';
import { parseJsonBody } from '@/lib/validation/http';
import { setPasswordSchema } from '@/lib/validation/user';

export async function GET() {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;

  const hasPassword = await userHasPassword(authResult.session.user.id);
  return NextResponse.json({ hasPassword });
}

export async function POST(req: Request) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;

  const parsed = await parseJsonBody(req, setPasswordSchema);
  if ('error' in parsed) return parsed.error;

  const result = await setUserPassword(
    authResult.session.user.id,
    parsed.data.newPassword,
    parsed.data.currentPassword
  );

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
