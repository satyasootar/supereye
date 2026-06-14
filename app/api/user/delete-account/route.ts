import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deleteUserAccount, DeleteAccountError } from '@/lib/user/delete-account';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { confirmEmail?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const confirmEmail = body.confirmEmail;
  if (typeof confirmEmail !== 'string' || !confirmEmail.trim()) {
    return NextResponse.json(
      { error: 'Enter your email address to confirm deletion' },
      { status: 400 }
    );
  }

  try {
    await deleteUserAccount(
      session.user.id,
      session.user.email,
      confirmEmail
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
