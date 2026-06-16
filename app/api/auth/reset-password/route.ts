import { NextResponse } from 'next/server';
import {
  completePasswordReset,
  validatePasswordResetToken,
} from '@/lib/auth/password-reset';
import { parseJsonBody, parseQuery } from '@/lib/validation/http';
import {
  resetPasswordSchema,
  resetPasswordTokenQuerySchema,
} from '@/lib/validation/user';

export async function GET(req: Request) {
  const parsed = parseQuery(req.url, resetPasswordTokenQuerySchema);
  if ('error' in parsed) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const result = await validatePasswordResetToken(parsed.data.token);
  if (!result.valid) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  return NextResponse.json({ valid: true });
}

export async function POST(req: Request) {
  const parsed = await parseJsonBody(req, resetPasswordSchema);
  if ('error' in parsed) return parsed.error;

  const result = await completePasswordReset(
    parsed.data.token,
    parsed.data.newPassword
  );

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    message: 'Your password has been updated. You can sign in now.',
  });
}
