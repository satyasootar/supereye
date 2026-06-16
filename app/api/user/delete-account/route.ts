import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { deleteUserAccount, DeleteAccountError } from '@/lib/user/delete-account';
import { parseJsonBody } from '@/lib/validation/http';
import { deleteAccountSchema } from '@/lib/validation/user';

export async function POST(req: Request) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const parsed = await parseJsonBody(req, deleteAccountSchema);
  if ('error' in parsed) return parsed.error;

  try {
    await deleteUserAccount(
      session.user.id,
      session.user.email,
      parsed.data.confirmEmail
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof DeleteAccountError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error('[delete-account]', e);
    return NextResponse.json(
      { error: 'Failed to delete account. Please try again.' },
      { status: 500 }
    );
  }
}
