import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { internalErrorResponse } from '@/lib/security/api-errors';
import { getTenant } from '@/lib/corsair';
import { getBody } from '@/lib/mail/sync';

export async function GET(req: Request) {
  try {
    const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

    const t = getTenant(session.user.id);
    const draftsRes = await t.gmail.api.drafts.list({ maxResults: 50 });
    const draftIds = draftsRes.drafts || [];

    // Fetch full draft details in parallel
    const draftsPromises = draftIds.map(async (d: any) => {
      try {
        const draft = await t.gmail.api.drafts.get({ id: d.id, format: 'full' });
        const m = draft.message;
        if (!m) return null;

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

        return {
          id: m.id, // Using message ID for UI consistency, but keeping draft ID could be useful
          draftId: draft.id,
          snippet: m.snippet,
          body: bodyStr,
          subject,
          sender,
          isRead: true,
          isStarred: false,
          isLinkedToEvent: false,
          date: new Date(parseInt(m.internalDate || '0')),
          toAddresses,
          isDraft: true
        };
      } catch (err) {
        console.error('Failed to fetch draft:', d.id, err);
        return null;
      }
    });

    const drafts = (await Promise.all(draftsPromises)).filter(Boolean);
    drafts.sort((a: any, b: any) => b.date.getTime() - a.date.getTime());

    return NextResponse.json({ messages: drafts });
  } catch (error: unknown) {
    return internalErrorResponse('Failed to fetch drafts', error);
  }
}
