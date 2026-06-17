import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { db } from '@/lib/db';
import { emails, emailEventLinks } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { triggerBackgroundSyncIfStale } from '@/lib/cache/background-sync';
import { mapEmailRowToMessage } from '@/lib/mail/priority';
import { syncGmailForUser } from '@/lib/mail/sync';
import { parseQuery } from '@/lib/validation/http';
import { mailThreadsQuerySchema } from '@/lib/validation/mail';

export async function GET(req: Request) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  triggerBackgroundSyncIfStale(session.user.id, 'gmail', () =>
    syncGmailForUser(session.user.id)
  );

  const parsed = parseQuery(req.url, mailThreadsQuerySchema);
  if ('error' in parsed) return parsed.error;
  const { offset, category, priority } = parsed.data;
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
    } else if (category === 'STARRED') {
      baseQuery = baseQuery.where(
        sql`${emails.userId} = ${session.user.id} AND ${emails.isStarred} = true${priorityFilter}`
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
