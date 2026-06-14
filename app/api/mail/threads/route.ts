import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { emails, emailEventLinks } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { mapEmailRowToMessage } from '@/lib/mail/priority';

export async function GET(req: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const category = searchParams.get('category') || 'INBOX';
  const priority = searchParams.get('priority');
  const priorityFilter =
    priority === 'urgent' || priority === 'can_wait'
      ? sql` AND ${emails.priorityTier} = ${priority}`
      : sql``;

  try {
    let baseQuery = db.select({
      email: emails,
      linkId: emailEventLinks.id
    })
      .from(emails)
      .leftJoin(emailEventLinks, eq(emails.id, emailEventLinks.emailId));

    if (category === 'ALL') {
      baseQuery = baseQuery.where(
        sql`${emails.userId} = ${session.user.id}${priorityFilter}`
      ) as typeof baseQuery;
    } else if (category === 'ARCHIVE') {
      baseQuery = baseQuery.where(
        sql`${emails.userId} = ${session.user.id} AND ${emails.isArchived} = true${priorityFilter}`
      ) as typeof baseQuery;
    } else if (category === 'INBOX') {
      const categoryFilter = JSON.stringify([category]);
      baseQuery = baseQuery.where(
        sql`${emails.userId} = ${session.user.id} AND ${emails.isArchived} = false AND (${emails.labelIds} @> ${categoryFilter}::jsonb OR ${emails.labelIds} IS NULL)${priorityFilter}`
      ) as typeof baseQuery;
    } else {
      const categoryFilter = JSON.stringify([category]);
      baseQuery = baseQuery.where(
        sql`${emails.userId} = ${session.user.id} AND ${emails.labelIds} @> ${categoryFilter}::jsonb${priorityFilter}`
      ) as typeof baseQuery;
    }

    const cachedEmails = await baseQuery
      .orderBy(desc(emails.internalDate))
      .limit(20)
      .offset(offset);

    const uniqueMessagesMap = new Map();
    for (const m of cachedEmails) {
      if (!uniqueMessagesMap.has(m.email.googleMessageId)) {
        uniqueMessagesMap.set(
          m.email.googleMessageId,
          mapEmailRowToMessage(m.email, m.linkId)
        );
      }
    }

    const fullMessages = Array.from(uniqueMessagesMap.values());

    return NextResponse.json({ messages: fullMessages });
  } catch (error: unknown) {
    console.error('Failed to fetch emails from DB:', error);
    const details = error instanceof Error ? error.message : undefined;
    return NextResponse.json({ 
      error: 'Failed to fetch emails',
      details,
    }, { status: 500 });
  }
}
