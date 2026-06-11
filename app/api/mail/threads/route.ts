import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { corsair } from '@/lib/corsair';

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const t = corsair.withTenant(session.user.id) as any;

    // Use the live API since local DB requires webhook setup which may not be running
    const gmailResult = await t.gmail.api.messages.list({ maxResults: 10 });
    const messageIds = gmailResult.messages || [];

    // Fetch the full message data for each ID so we get subject, sender, and snippet
    const fullMessages = await Promise.all(
      messageIds.map(async (msg: any) => {
        try {
          return await t.gmail.api.messages.get({ id: msg.id, format: 'metadata', metadataHeaders: ['Subject', 'From'] });
        } catch (e) {
          return msg;
        }
      })
    );

    return NextResponse.json({ messages: fullMessages });
  } catch (error: any) {
    console.error('Failed to fetch emails:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch emails',
      details: error?.message 
    }, { status: 500 });
  }
}
