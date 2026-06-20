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

  const { getConnectedPluginIds } = await import('@/lib/plugins/integrations');
  const connected = await getConnectedPluginIds(userId);

  if (connected.includes('email')) {
    void import('@/lib/mail/sync').then(({ syncGmailForUser }) =>
      syncGmailForUser(userId, { mode: 'incremental' }).catch(console.error)
    );
  }
  if (connected.includes('calendar')) {
    void import('@/lib/calendar/sync').then(({ syncCalendarForUser }) =>
      syncCalendarForUser(userId).catch(console.error)
    );
  }
  if (connected.includes('github')) {
    void import('@/lib/github/sync').then(({ syncGithubForUser }) =>
      syncGithubForUser(userId).catch(console.error)
    );
  }
  if (connected.includes('drive')) {
    void import('@/lib/drive/sync').then(({ syncDriveForUser }) =>
      syncDriveForUser(userId).catch(console.error)
    );
  }

  const brief = await generateDailyBrief(userId, { force });
  return NextResponse.json({ brief });
}
