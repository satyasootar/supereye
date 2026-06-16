import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { syncDriveForUser } from '@/lib/drive/sync';

export async function POST() {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  try {
    const result = await syncDriveForUser(session.user.id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Drive sync failed';
    console.error('Drive sync error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
