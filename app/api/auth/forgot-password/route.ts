import { NextResponse } from 'next/server';
import { requestPasswordReset } from '@/lib/auth/password-reset';
import { parseJsonBody } from '@/lib/validation/http';
import { forgotPasswordSchema } from '@/lib/validation/user';

export async function POST(req: Request) {
  const parsed = await parseJsonBody(req, forgotPasswordSchema);
  if ('error' in parsed) return parsed.error;

  await requestPasswordReset(parsed.data.email);

  return NextResponse.json({
    ok: true,
    message:
      'If an account exists for that email, we sent a password reset link. Check your inbox.',
  });
}
