import { db } from '@/lib/db';
import { emails, syncState } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { sseEmitter } from '@/lib/sse/emitter';

function getBody(payload: any): string {
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
    const { corsair } = await import('@/lib/corsair');
    const t = corsair.withTenant(userId) as any;

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
        const m = await t.gmail.api.messages.get({ id: msg.id, format: 'full' });
        const headers = m.payload?.headers || [];
        const subject = headers.find((h: any) => h.name?.toLowerCase() === 'subject')?.value || '';
        const sender = headers.find((h: any) => h.name?.toLowerCase() === 'from')?.value || '';
        const bodyStr = getBody(m.payload);
        
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
          historyId: m.historyId
        });
      } catch (err) {
        console.error('Failed to fetch message', msg.id, err);
      }
    }

    if (toInsert.length > 0) {
      await db.insert(emails).values(toInsert).onConflictDoUpdate({
        target: [emails.userId, emails.googleMessageId],
        set: {
          isRead: sql`excluded.is_read`,
          isStarred: sql`excluded.is_starred`,
          snippet: sql`excluded.snippet`,
          body: sql`excluded.body`,
        }
      });
      
      sseEmitter.emit(userId, { type: 'email:updated' });
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
