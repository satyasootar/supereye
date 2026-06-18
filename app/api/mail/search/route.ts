import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { internalErrorResponse } from '@/lib/security/api-errors';
import { db } from '@/lib/db';
import { emails, emailEventLinks } from '@/lib/db/schema';
import { eq, desc, ilike, or, sql, and } from 'drizzle-orm';
import { getTenant } from '@/lib/corsair';
import { getBody } from '@/lib/mail/sync';
import { mapEmailRowToMessage } from '@/lib/mail/priority';
import { parseQuery } from '@/lib/validation/http';
import { mailSearchQuerySchema } from '@/lib/validation/mail';

export async function GET(req: Request) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const { searchParams } = new URL(req.url);
  const rawQ = searchParams.get('q') ?? '';
  if (!rawQ.trim()) {
    return NextResponse.json({ messages: [] });
  }

  const parsed = parseQuery(req.url, mailSearchQuerySchema);
  if ('error' in parsed) return parsed.error;
  const q = parsed.data.q;

  try {
    const userId = session.user.id;
    
    let localQ = q;
    let fromFilter = '';
    
    const fromMatch = q.match(/from:\((.*?)\)|from:([^\s]+)/);
    if (fromMatch) {
       fromFilter = (fromMatch[1] || fromMatch[2]).trim();
       localQ = q.replace(fromMatch[0], '').trim();
    }

    const searchPattern = `%${localQ}%`;
    
    const conditions = [eq(emails.userId, userId)];
    
    if (fromFilter) {
      conditions.push(ilike(emails.fromAddress, `%${fromFilter}%`));
    }
    
    if (localQ) {
      const orCondition = or(
        ilike(emails.subject, searchPattern),
        ilike(emails.snippet, searchPattern),
        ilike(emails.body, searchPattern),
        ilike(emails.fromAddress, searchPattern)
      );
      if (orCondition) {
        conditions.push(orCondition);
      }
    }

    // 1. Local DB Search
    const localResults = await db.select({
      email: emails,
      linkId: emailEventLinks.id
    })
    .from(emails)
    .leftJoin(emailEventLinks, eq(emails.id, emailEventLinks.emailId))
    .where(and(...conditions) as any)
    .orderBy(desc(emails.internalDate))
    .limit(25);

    // Map to our UI format
    const uniqueMessagesMap = new Map();
    for (const m of localResults) {
      if (!uniqueMessagesMap.has(m.email.googleMessageId)) {
        uniqueMessagesMap.set(
          m.email.googleMessageId,
          mapEmailRowToMessage(m.email, m.linkId)
        );
      }
    }

    // 2. Gmail API Search (Deep fetch)
    const t = getTenant(userId);
    let gmailMessagesFetched = 0;
    try {
      const gmailResult = await t.gmail.api.messages.list({ q, maxResults: 15 });
      const messageIds = gmailResult.messages || [];
      
      const missingMessageIds = messageIds.filter((msg: any) => !uniqueMessagesMap.has(msg.id));
      
      const toInsert: any[] = [];
      const fetchPromises = missingMessageIds.map(async (msg: any) => {
        try {
          const m = await t.gmail.api.messages.get({ userId: 'me', id: msg.id, format: 'full' });
          const headers = m.payload?.headers || [];
          const subject = headers.find((h: any) => h.name?.toLowerCase() === 'subject')?.value || '';
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
          
          const dbPayload = {
            userId,
            googleMessageId: m.id,
            threadId: m.threadId,
            fromAddress: sender,
            subject,
            snippet: m.snippet,
            body: bodyStr,
            internalDate: new Date(parseInt(m.internalDate || '0')),
            isRead: !m.labelIds?.includes('UNREAD'),
            isStarred: m.labelIds?.includes('STARRED'),
            labelIds: m.labelIds || [],
            toAddresses,
            historyId: m.historyId
          };
          
          return {
            dbPayload,
            uiPayload: {
              id: m.id,
              snippet: m.snippet,
              body: bodyStr,
              subject,
              sender,
              isRead: !m.labelIds?.includes('UNREAD'),
              isStarred: m.labelIds?.includes('STARRED'),
              isLinkedToEvent: false, // Assume false for newly fetched
              date: new Date(parseInt(m.internalDate || '0')),
              toAddresses
            }
          };
        } catch (err) {
          console.error('Failed to fetch individual message in search:', msg.id, err);
          return null;
        }
      });
      
      const fetchedResults = await Promise.all(fetchPromises);
      for (const res of fetchedResults) {
        if (res) {
          toInsert.push(res.dbPayload);
          uniqueMessagesMap.set(res.uiPayload.id, res.uiPayload);
          gmailMessagesFetched++;
        }
      }
      
      // Save newly fetched to cache in background
      if (toInsert.length > 0) {
        // Don't await the insert so we return faster
        db.insert(emails).values(toInsert).onConflictDoNothing().execute().catch(e => console.error('Failed to save search results to cache', e));
      }
    } catch (gmailErr: any) {
      console.error('Gmail API Search failed, falling back to local only:', gmailErr.message);
    }

    // Convert map to array and sort by date descending
    let fullMessages = Array.from(uniqueMessagesMap.values());
    fullMessages.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ 
      messages: fullMessages,
      meta: {
        localCount: localResults.length,
        gmailFetched: gmailMessagesFetched
      }
    });
  } catch (error: unknown) {
    return internalErrorResponse('Failed to search emails', error);
  }
}
