import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { recordUserHeartbeat } from '@/lib/monitoring/activity';

export async function POST() {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;

  await recordUserHeartbeat(authResult.session.user.id);
  return NextResponse.json({ ok: true });
}
