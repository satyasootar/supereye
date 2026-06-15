import { NextRequest, NextResponse } from 'next/server';
import { corsair } from '@/lib/corsair';
import { processOAuthCallback } from 'corsair/oauth';
import { redirect } from 'next/navigation';
import { getUserPreferences } from '@/lib/user/preferences';
import { syncWorkspacesFromPlugins } from '@/lib/workspaces/workspaces';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/corsair/callback`;

  let successUrl = '/workspace/onboarding?connected=1';

  try {
    const result = await processOAuthCallback(corsair, {
      code,
      state,
      redirectUri,
    });

    console.log(`Successfully connected ${result.plugin} for tenant ${result.tenantId}`);

    // Trigger initial sync and watch registration on successful OAuth connection
    if (result.plugin === 'googlecalendar') {
      const { syncCalendarForUser } = await import('@/lib/calendar/sync');
      syncCalendarForUser(result.tenantId).catch(err => 
        console.error('[OAuth Callback] Initial calendar sync failed:', err)
      );
    } else if (result.plugin === 'gmail') {
      const { syncGmailForUser } = await import('@/lib/mail/sync');
      syncGmailForUser(result.tenantId).catch(err => 
        console.error('[OAuth Callback] Initial Gmail sync failed:', err)
      );
    }

    await syncWorkspacesFromPlugins(result.tenantId);

    const prefs = await getUserPreferences(result.tenantId);
    successUrl = prefs.onboardingCompleted
      ? '/workspace'
      : '/workspace/onboarding?connected=1';
  } catch (error: unknown) {
    console.error('OAuth Callback Error:', error);
    const message = error instanceof Error ? error.message : 'OAuth callback failed';
    return NextResponse.json({ 
      error: 'Failed to process OAuth callback',
      message,
    }, { status: 500 });
  }

  // Next.js redirect must be called outside try/catch because it throws an error internally to work.
  redirect(successUrl);
}
