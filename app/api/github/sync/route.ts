import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { syncGithubForUser } from '@/lib/github/sync';

export async function POST() {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  try {
    const result = await syncGithubForUser(session.user.id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'GitHub sync failed';
    console.error('GitHub sync error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
