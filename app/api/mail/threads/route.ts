import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { emails } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cachedEmails = await db.select()
      .from(emails)
      .where(eq(emails.userId, session.user.id))
      .orderBy(desc(emails.internalDate))
      .limit(20);

    const fullMessages = cachedEmails.map(m => ({
      id: m.googleMessageId,
      snippet: m.snippet,
      subject: m.subject,
      sender: m.fromAddress,
      isRead: m.isRead,
      isStarred: m.isStarred
    }));

    return NextResponse.json({ messages: fullMessages });
  } catch (error: any) {
    console.error('Failed to fetch emails from DB:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch emails',
      details: error?.message 
    }, { status: 500 });
  }
}
