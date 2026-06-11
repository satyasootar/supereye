import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { corsair } = await import('@/lib/corsair');
    const t = corsair.withTenant(session.user.id) as any;

    // Use the live API since local DB requires webhook setup which may not be running
    const gmailResult = await t.gmail.api.messages.list({ maxResults: 10 });
    const messageIds = gmailResult.messages || [];

    // Fetch the full message data sequentially to prevent concurrent memory spikes in V8
    const fullMessages = [];
    for (const msg of messageIds) {
      try {
        const m = await t.gmail.api.messages.get({ id: msg.id, format: 'metadata', metadataHeaders: ['Subject', 'From'] });
        const headers = m.payload?.headers || [];
        const subject = headers.find((h: any) => h.name?.toLowerCase() === 'subject')?.value;
        const sender = headers.find((h: any) => h.name?.toLowerCase() === 'from')?.value;

        fullMessages.push({
          id: m.id,
          snippet: m.snippet,
          subject,
          sender,
        });
      } catch (e) {
        fullMessages.push({ id: msg.id });
      }
    }

    return NextResponse.json({ messages: fullMessages });
  } catch (error: any) {
    console.error('Failed to fetch emails:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch emails',
      details: error?.message 
    }, { status: 500 });
  }
}
