/**
 * Generate Corsair OAuth URL for connecting Gmail or Calendar.
 * Called when user clicks "Connect Gmail" or "Connect Calendar" in the dashboard.
 */
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { corsair } from '@/lib/corsair';

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const plugin = body.plugin as 'gmail' | 'googlecalendar';

  if (!plugin || !['gmail', 'googlecalendar'].includes(plugin)) {
    return Response.json(
      { error: 'Invalid plugin. Must be "gmail" or "googlecalendar".' },
      { status: 400 }
    );
  }

  try {
    // Generate OAuth URL scoped to this specific user
    const authUrl = await (corsair as any)[plugin].oauth.getAuthUrl({
      tenantId: session.user.id,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/corsair/callback`,
    });

    return Response.json({ authUrl });
  } catch (error) {
    console.error(`Failed to generate ${plugin} auth URL:`, error);
    return Response.json(
      { error: 'Failed to generate auth URL' },
      { status: 500 }
    );
  }
}
