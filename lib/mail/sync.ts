import { db } from '@/lib/db';
import { emails, syncState } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { sseEmitter } from '@/lib/sse/emitter';
import { getTenant } from '@/lib/corsair';

export function getBody(payload: any): string {
  if (!payload) return '';
  let body = '';
  
  if (payload.body && payload.body.data) {
    body = Buffer.from(payload.body.data, 'base64url').toString('utf8');
  } else if (payload.parts) {
    let plain = '';
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body && part.body.data) {
        return Buffer.from(part.body.data, 'base64url').toString('utf8');
      } else if (part.mimeType === 'text/plain' && part.body && part.body.data) {
        plain = Buffer.from(part.body.data, 'base64url').toString('utf8');
      } else if (part.parts) {
        const nested = getBody(part);
        if (nested) return nested;
      }
    }
    return plain;
  }
  return body;
}

export async function syncGmailForUser(userId: string) {
  try {
    const t = getTenant(userId);

    // Automatically register/renew the push notification watch
    const topicName = process.env.GMAIL_PUBSUB_TOPIC;
    if (topicName) {
      try {
        await t.gmail.api.users.watch({
          userId: 'me',
          requestBody: {
            topicName,
            labelIds: ['INBOX']
          }
        });
      } catch (watchErr: any) {
        console.error('Failed to register/renew Gmail watch:', watchErr.message);
      }
    }

    const gmailResult = await t.gmail.api.messages.list({ maxResults: 20 });
    const messageIds = gmailResult.messages || [];

    const toInsert = [];

    for (const msg of messageIds) {
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
        
        toInsert.push({
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
        });
      } catch (err) {
        console.error('Failed to fetch message', msg.id, err);
      }
    }

    const existingDbEmails = await db.select({ googleMessageId: emails.googleMessageId })
      .from(emails)
      .where(sql`${emails.userId} = ${userId}`);
    const existingIds = new Set(existingDbEmails.map(e => e.googleMessageId));

    if (toInsert.length > 0) {
      await db.insert(emails).values(toInsert).onConflictDoUpdate({
        target: [emails.userId, emails.googleMessageId],
        set: {
          isRead: sql`excluded.is_read`,
          isStarred: sql`excluded.is_starred`,
          snippet: sql`excluded.snippet`,
          body: sql`excluded.body`,
          labelIds: sql`excluded.label_ids`,
          toAddresses: sql`excluded.to_addresses`,
        }
      });
      
      sseEmitter.emit(userId, { type: 'email:updated' });

      // Create notifications for completely new emails
      const newEmails = toInsert.filter(m => !existingIds.has(m.googleMessageId));
        if (newEmails.length > 0) {
        const { notifications } = await import('@/lib/db/schema');
        const notifsToInsert = newEmails.map(m => ({
          userId,
          type: 'email',
          title: `New Email: ${m.subject || '(No Subject)'}`,
          body: m.snippet || '',
          link: `/emails/${m.googleMessageId}`
        }));
        
        await db.insert(notifications).values(notifsToInsert);
        
        // Emit SSE for each new notification
        for (const notif of notifsToInsert) {
          sseEmitter.emit(userId, { 
            type: 'notification:new', 
            data: notif as Record<string, unknown>
          });
        }

        const inboxNewIds = newEmails
          .filter((m) => !m.isRead && (m.labelIds?.includes('INBOX') ?? true))
          .map((m) => m.googleMessageId);

        if (inboxNewIds.length > 0) {
          void import('@/lib/mail/triage').then(({ triageNewEmailsForUser }) =>
            triageNewEmailsForUser(userId, inboxNewIds).catch((err) =>
              console.error('Background email triage failed:', err)
            )
          );
        }
      }
    }

    await db.insert(syncState).values({
      userId,
      provider: 'gmail',
      lastSyncedAt: new Date()
    }).onConflictDoUpdate({
      target: [syncState.userId, syncState.provider],
      set: { lastSyncedAt: new Date() }
    });

    return { success: true, count: toInsert.length };
  } catch (error: any) {
    console.error('Mail sync logic error:', error);
    throw error;
  }
}
