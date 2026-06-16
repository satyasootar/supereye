import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { checkAiAccess } from '@/lib/billing/usage';
import { generateDailyBrief } from '@/lib/brief/generate';

export async function POST(req: Request) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;

  const userId = authResult.session.user.id;

  try {
    await checkAiAccess(userId);
  } catch {
    return NextResponse.json(
      { error: 'Insufficient tokens for AI brief generation' },
      { status: 402 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const force = body?.force === true;

  // Background sync before generating
  void import('@/lib/mail/sync').then(({ syncGmailForUser }) =>
    syncGmailForUser(userId).catch(console.error)
  );
  void import('@/lib/calendar/sync').then(({ syncCalendarForUser }) =>
    syncCalendarForUser(userId).catch(console.error)
  );

  const brief = await generateDailyBrief(userId, { force });
  return NextResponse.json({ brief });
}
