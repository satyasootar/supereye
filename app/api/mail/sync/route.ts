import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { syncGmailForUser } from '@/lib/mail/sync';

export async function POST() {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const userId = session.user.id;

  try {
    const result = await syncGmailForUser(userId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Mail sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
