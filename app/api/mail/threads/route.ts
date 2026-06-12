import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { emails, emailEventLinks } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cachedEmails = await db.select({
      email: emails,
      linkId: emailEventLinks.id
    })
      .from(emails)
      .leftJoin(emailEventLinks, eq(emails.id, emailEventLinks.emailId))
      .where(eq(emails.userId, session.user.id))
      .orderBy(desc(emails.internalDate))
      .limit(20);

    const fullMessages = cachedEmails.map(m => ({
      id: m.email.googleMessageId,
      snippet: m.email.snippet,
      body: m.email.body,
      subject: m.email.subject,
      sender: m.email.fromAddress,
      isRead: m.email.isRead,
      isStarred: m.email.isStarred,
      isLinkedToEvent: !!m.linkId
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
