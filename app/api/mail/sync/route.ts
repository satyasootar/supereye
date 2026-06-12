import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { syncGmailForUser } from '@/lib/mail/sync';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const result = await syncGmailForUser(userId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Mail sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
