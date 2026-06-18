import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emails } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { internalErrorResponse } from '@/lib/security/api-errors';
import { getTenant } from '@/lib/corsair';
import { getBody } from '@/lib/mail/sync';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  try {
    const { id: googleMessageId } = await params;
    
    // First find the email to get its threadId
    const emailResults = await db.select()
      .from(emails)
      .where(
        and(
          eq(emails.userId, session.user.id),
          eq(emails.googleMessageId, googleMessageId)
        )
      )
      .limit(1);

    const initialEmail = emailResults[0];
    if (!initialEmail) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }
    const threadId = initialEmail.threadId || googleMessageId;

    const t = getTenant(session.user.id);
    
    // Fetch full thread from Google
    const thread = await t.gmail.api.threads.get({ id: threadId, format: 'full' });
    const messages = thread.messages || [];
    
    const parsedMessages = [];
    const toInsert = [];

    for (const m of messages) {
      const headers = m.payload?.headers || [];
      const subject = headers.find((h: any) => h.name?.toLowerCase() === 'subject')?.value || '(No Subject)';
      const sender = headers.find((h: any) => h.name?.toLowerCase() === 'from')?.value || '';
      const toHeader = headers.find((h: any) => h.name?.toLowerCase() === 'to')?.value || '';
      const bodyStr = getBody(m.payload);
      
      const toAddresses = toHeader.split(',').filter(Boolean).map((addr: string) => {
        const match = addr.match(/(?:(.*)\s+)?<([^>]+)>/);
        if (match) {
           return { name: match[1]?.replace(/"/g, '').trim(), email: match[2]?.trim() };
        }
        return { email: addr.trim() };
      });
      
      const isRead = !m.labelIds?.includes('UNREAD');
      const isStarred = m.labelIds?.includes('STARRED');
      const internalDate = new Date(parseInt(m.internalDate || '0'));

      const dbPayload = {
        userId: session.user.id,
        googleMessageId: m.id,
        threadId: m.threadId,
        fromAddress: sender,
        subject,
        snippet: m.snippet,
        body: bodyStr,
        internalDate,
        isRead,
        isStarred,
        labelIds: m.labelIds || [],
        toAddresses,
        historyId: m.historyId
      };
      
      toInsert.push(dbPayload);

      parsedMessages.push({
        id: m.id,
        googleMessageId: m.id,
        snippet: m.snippet,
        body: bodyStr,
        subject,
        sender,
        fromAddress: sender,
        isRead,
        isStarred,
        isLinkedToEvent: false,
        date: internalDate,
        internalDate,
        threadId: m.threadId,
        toAddresses,
      });
    }

    // Fire and forget cache update
    if (toInsert.length > 0) {
      Promise.all(toInsert.map(payload => 
        db.insert(emails).values(payload).onConflictDoNothing()
      )).catch(e => console.error('Failed to cache thread messages', e));
    }

    parsedMessages.sort((a, b) => a.date.getTime() - b.date.getTime());

    return NextResponse.json({ messages: parsedMessages });
  } catch (error: unknown) {
    return internalErrorResponse('Failed to fetch thread', error);
  }
}
