import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { emails, emailEventLinks } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export async function GET(req: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const category = searchParams.get('category') || 'INBOX';

  try {
    let baseQuery = db.select({
      email: emails,
      linkId: emailEventLinks.id
    })
      .from(emails)
      .leftJoin(emailEventLinks, eq(emails.id, emailEventLinks.emailId));

    if (category === 'ALL') {
      baseQuery = baseQuery.where(eq(emails.userId, session.user.id)) as any;
    } else if (category === 'ARCHIVE') {
      baseQuery = baseQuery.where(
        sql`${emails.userId} = ${session.user.id} AND ${emails.isArchived} = true`
      ) as any;
    } else if (category === 'INBOX') {
      const categoryFilter = JSON.stringify([category]);
      baseQuery = baseQuery.where(
        sql`${emails.userId} = ${session.user.id} AND ${emails.isArchived} = false AND (${emails.labelIds} @> ${categoryFilter}::jsonb OR ${emails.labelIds} IS NULL)`
      ) as any;
    } else {
      const categoryFilter = JSON.stringify([category]);
      baseQuery = baseQuery.where(
        sql`${emails.userId} = ${session.user.id} AND ${emails.labelIds} @> ${categoryFilter}::jsonb`
      ) as any;
    }

    const cachedEmails = await baseQuery
      .orderBy(desc(emails.internalDate))
      .limit(20)
      .offset(offset);

    const uniqueMessagesMap = new Map();
    for (const m of cachedEmails) {
      if (!uniqueMessagesMap.has(m.email.googleMessageId)) {
        uniqueMessagesMap.set(m.email.googleMessageId, {
          id: m.email.googleMessageId,
          snippet: m.email.snippet,
          body: m.email.body,
          subject: m.email.subject,
          sender: m.email.fromAddress,
          isRead: m.email.isRead,
          isStarred: m.email.isStarred,
          isLinkedToEvent: !!m.linkId,
          date: m.email.internalDate,
          toAddresses: m.email.toAddresses
        });
      }
    }

    const fullMessages = Array.from(uniqueMessagesMap.values());

    return NextResponse.json({ messages: fullMessages });
  } catch (error: any) {
    console.error('Failed to fetch emails from DB:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch emails',
      details: error?.message 
    }, { status: 500 });
  }
}
