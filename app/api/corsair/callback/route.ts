import { NextRequest, NextResponse } from 'next/server';
import { corsair } from '@/lib/corsair';
import { processOAuthCallback } from 'corsair/oauth';
import { redirect } from 'next/navigation';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/corsair/callback`;

  let successUrl = '/';

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
  } catch (error: any) {
    console.error('OAuth Callback Error:', error);
    return NextResponse.json({ 
      error: 'Failed to process OAuth callback',
      message: error?.message,
      stack: error?.stack 
    }, { status: 500 });
  }

  // Next.js redirect must be called outside try/catch because it throws an error internally to work.
  redirect(successUrl);
}
