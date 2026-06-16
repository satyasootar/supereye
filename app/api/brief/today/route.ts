import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { getTodayBrief } from '@/lib/brief/generate';

export async function GET() {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;

  const brief = await getTodayBrief(authResult.session.user.id);
  return NextResponse.json({ brief });
}
