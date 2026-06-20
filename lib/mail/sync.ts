import { db } from '@/lib/db';
import { emails, syncState } from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { sseEmitter } from '@/lib/sse/emitter';
import { getTenant } from '@/lib/corsair';
import { registerGmailWatch } from '@/lib/mail/watch';
import {
  MAIL_BACKFILL_COMPLETE,
  MAIL_BATCH_SIZE,
  MAIL_FETCH_CONCURRENCY,
  MAIL_PREFETCH_BATCHES,
  MAIL_THREADS_PAGE_SIZE,
} from '@/lib/mail/constants';

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

export type GmailSyncMode =
  | 'initial'
  | 'prefetch'
  | 'backfill'
  | 'incremental';

export type SyncGmailOptions = {
  mode?: GmailSyncMode;
  batchSize?: number;
  maxBatches?: number;
};

export type SyncGmailResult = {
  success: boolean;
  count: number;
  hasMore: boolean;
  backfillComplete: boolean;
};

type GmailSyncStateRow = {
  lastSyncToken: string | null;
  lastSyncedAt: Date | null;
};

type EmailInsertRow = {
  userId: string;
  googleMessageId: string;
  threadId: string | null | undefined;
  fromAddress: string;
  subject: string;
  snippet: string | null | undefined;
  body: string;
  internalDate: Date;
  isRead: boolean;
  isStarred: boolean;
  labelIds: string[];
  toAddresses: { email: string; name?: string }[];
  historyId: string | null | undefined;
};

const syncLocks = new Map<string, Promise<SyncGmailResult>>();

export function isGmailBackfillComplete(token: string | null | undefined): boolean {
  return token === MAIL_BACKFILL_COMPLETE;
}

/** Treat pre-pagination users (synced, no page token) as backfill-complete. */
export async function resolveGmailBackfillComplete(
  userId: string
): Promise<boolean> {
  const state = await getGmailSyncState(userId);
  if (isGmailBackfillComplete(state?.lastSyncToken)) return true;

  if (state?.lastSyncedAt && state.lastSyncToken == null) {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(emails)
      .where(eq(emails.userId, userId));

    if ((row?.count ?? 0) > 0) {
      await updateGmailSyncState(userId, MAIL_BACKFILL_COMPLETE);
      return true;
    }
  }

  return false;
}

export async function getGmailSyncState(
  userId: string
): Promise<GmailSyncStateRow | null> {
  const [row] = await db
    .select({
      lastSyncToken: syncState.lastSyncToken,
      lastSyncedAt: syncState.lastSyncedAt,
    })
    .from(syncState)
    .where(and(eq(syncState.userId, userId), eq(syncState.provider, 'gmail')))
    .limit(1);

  return row ?? null;
}

function parseGmailMessage(userId: string, m: any): EmailInsertRow | null {
  if (!m?.id) return null;

  const headers = m.payload?.headers || [];
  const subject =
    headers.find((h: any) => h.name?.toLowerCase() === 'subject')?.value || '';
  const sender =
    headers.find((h: any) => h.name?.toLowerCase() === 'from')?.value || '';
  const toHeader =
    headers.find((h: any) => h.name?.toLowerCase() === 'to')?.value || '';
  const bodyStr = getBody(m.payload);

  const toAddresses = toHeader
    .split(',')
    .filter(Boolean)
    .map((addr: string) => {
      const match = addr.match(/(?:(.*)\s+)?<([^>]+)>/);
      if (match) {
        return {
          name: match[1]?.replace(/"/g, '').trim(),
          email: match[2]?.trim(),
        };
      }
      return { email: addr.trim() };
    });

  return {
    userId,
    googleMessageId: m.id,
    threadId: m.threadId,
    fromAddress: sender,
    subject,
    snippet: m.snippet,
    body: bodyStr,
    internalDate: new Date(parseInt(m.internalDate || '0', 10)),
    isRead: !m.labelIds?.includes('UNREAD'),
    isStarred: m.labelIds?.includes('STARRED'),
    labelIds: m.labelIds || [],
    toAddresses,
    historyId: m.historyId,
  };
}

async function fetchFullMessages(
  userId: string,
  messageIds: { id: string }[]
): Promise<EmailInsertRow[]> {
  const t = getTenant(userId);
  const results: EmailInsertRow[] = [];

  for (let i = 0; i < messageIds.length; i += MAIL_FETCH_CONCURRENCY) {
    const chunk = messageIds.slice(i, i + MAIL_FETCH_CONCURRENCY);
    const fetched = await Promise.all(
      chunk.map(async (msg) => {
        try {
          const m = await t.gmail.api.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'full',
          });
          return parseGmailMessage(userId, m);
        } catch (err: unknown) {
          const status =
            err && typeof err === 'object' && 'status' in err
              ? (err as { status?: number }).status
              : undefined;
          if (status === 404) return null;
          console.error('Failed to fetch message', msg.id, err);
          return null;
        }
      })
    );
    results.push(...fetched.filter((row): row is EmailInsertRow => row !== null));
  }

  return results;
}

async function persistEmailBatch(
  userId: string,
  toInsert: EmailInsertRow[],
  options: { notify: boolean }
): Promise<number> {
  if (toInsert.length === 0) return 0;

  const existingDbEmails = await db
    .select({ googleMessageId: emails.googleMessageId })
    .from(emails)
    .where(eq(emails.userId, userId));
  const existingIds = new Set(existingDbEmails.map((e) => e.googleMessageId));

  await db
    .insert(emails)
    .values(toInsert)
    .onConflictDoUpdate({
      target: [emails.userId, emails.googleMessageId],
      set: {
        isRead: sql`excluded.is_read`,
        isStarred: sql`excluded.is_starred`,
        snippet: sql`excluded.snippet`,
        body: sql`excluded.body`,
        fromAddress: sql`excluded.from_address`,
        subject: sql`excluded.subject`,
        labelIds: sql`excluded.label_ids`,
        toAddresses: sql`excluded.to_addresses`,
      },
    });

  sseEmitter.emit(userId, { type: 'email:updated' });

  const newEmails = toInsert.filter((m) => !existingIds.has(m.googleMessageId));

  if (options.notify && newEmails.length > 0) {
    const { notifications } = await import('@/lib/db/schema');
    const notifsToInsert = newEmails.map((m) => ({
      userId,
      type: 'email',
      title: `New Email: ${m.subject || '(No Subject)'}`,
      body: m.snippet || '',
      link: `/emails/${m.googleMessageId}`,
    }));

    await db.insert(notifications).values(notifsToInsert);

    for (const notif of notifsToInsert) {
      sseEmitter.emit(userId, {
        type: 'notification:new',
        data: notif as Record<string, unknown>,
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

  return toInsert.length;
}

async function updateGmailSyncState(
  userId: string,
  nextToken: string | null
): Promise<void> {
  await db
    .insert(syncState)
    .values({
      userId,
      provider: 'gmail',
      lastSyncToken: nextToken,
      lastSyncedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [syncState.userId, syncState.provider],
      set: {
        lastSyncToken: nextToken,
        lastSyncedAt: new Date(),
      },
    });
}

async function syncGmailBatchInternal(
  userId: string,
  options: {
    batchSize: number;
    mode: GmailSyncMode;
    pageToken?: string | null;
  }
): Promise<SyncGmailResult> {
  const t = getTenant(userId);
  const state = await getGmailSyncState(userId);
  const backfillAlreadyComplete = await resolveGmailBackfillComplete(userId);

  const useStoredPageToken =
    options.mode === 'backfill' || options.mode === 'prefetch';
  const pageToken = useStoredPageToken
    ? options.pageToken ?? state?.lastSyncToken ?? undefined
    : undefined;

  if (useStoredPageToken && backfillAlreadyComplete) {
    return {
      success: true,
      count: 0,
      hasMore: false,
      backfillComplete: true,
    };
  }

  if (useStoredPageToken && pageToken === MAIL_BACKFILL_COMPLETE) {
    return {
      success: true,
      count: 0,
      hasMore: false,
      backfillComplete: true,
    };
  }

  const gmailResult = await t.gmail.api.messages.list({
    userId: 'me',
    maxResults: options.batchSize,
    pageToken: pageToken || undefined,
  });

  const messageIds = gmailResult.messages ?? [];
  const toInsert = await fetchFullMessages(userId, messageIds);

  const shouldNotify =
    options.mode === 'incremental' && backfillAlreadyComplete;

  const count = await persistEmailBatch(userId, toInsert, {
    notify: shouldNotify,
  });

  const nextPageToken = gmailResult.nextPageToken ?? null;
  const backfillComplete =
    options.mode === 'incremental'
      ? backfillAlreadyComplete
      : !nextPageToken;

  if (options.mode === 'incremental') {
    await db
      .insert(syncState)
      .values({
        userId,
        provider: 'gmail',
        lastSyncToken: state?.lastSyncToken ?? null,
        lastSyncedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [syncState.userId, syncState.provider],
        set: { lastSyncedAt: new Date() },
      });
  } else {
    const storedToken = backfillComplete
      ? MAIL_BACKFILL_COMPLETE
      : nextPageToken;
    await updateGmailSyncState(userId, storedToken);
  }

  return {
    success: true,
    count,
    hasMore: !backfillComplete,
    backfillComplete,
  };
}

async function runSyncGmailForUser(
  userId: string,
  options: SyncGmailOptions = {}
): Promise<SyncGmailResult> {
  const mode = options.mode ?? 'incremental';
  const batchSize = options.batchSize ?? MAIL_BATCH_SIZE;
  const maxBatches =
    options.maxBatches ??
    (mode === 'prefetch'
      ? MAIL_PREFETCH_BATCHES
      : mode === 'initial' || mode === 'backfill' || mode === 'incremental'
        ? 1
        : 1);

  try {
    if (mode === 'initial') {
      await registerGmailWatch(userId);
    }

    let totalCount = 0;
    let hasMore = false;
    let backfillComplete = false;

    for (let i = 0; i < maxBatches; i++) {
      const result = await syncGmailBatchInternal(userId, {
        batchSize,
        mode,
      });
      totalCount += result.count;
      hasMore = result.hasMore;
      backfillComplete = result.backfillComplete;
      if (!result.hasMore || result.count === 0) break;
    }

    return {
      success: true,
      count: totalCount,
      hasMore,
      backfillComplete,
    };
  } catch (error: unknown) {
    console.error('Mail sync logic error:', error);
    throw error;
  }
}

/** Sync Gmail messages in batches. Dedupes concurrent syncs per user. */
export async function syncGmailForUser(
  userId: string,
  options: SyncGmailOptions = {}
): Promise<SyncGmailResult> {
  const lockKey = userId;
  const existing = syncLocks.get(lockKey);
  if (existing) return existing;

  const promise = runSyncGmailForUser(userId, options).finally(() => {
    syncLocks.delete(lockKey);
  });
  syncLocks.set(lockKey, promise);

  const result = await promise;

  if (options.mode === 'initial' && result.hasMore) {
    void syncGmailForUser(userId, {
      mode: 'prefetch',
      maxBatches: MAIL_PREFETCH_BATCHES,
    }).catch((err) => console.error('[gmail] prefetch failed:', err));
  }

  return result;
}

/** Ensure at least one batch exists before serving an empty inbox. */
export async function ensureInitialGmailBatch(userId: string): Promise<void> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(emails)
    .where(eq(emails.userId, userId));

  if ((row?.count ?? 0) > 0) return;

  await syncGmailForUser(userId, { mode: 'initial' });
}

/** Load the next backfill batch when the UI scrolls past cached emails. */
export async function syncGmailBackfillIfNeeded(
  userId: string,
  requestedOffset: number
): Promise<void> {
  if (await resolveGmailBackfillComplete(userId)) return;

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(emails)
    .where(eq(emails.userId, userId));

  const cachedCount = row?.count ?? 0;
  if (requestedOffset + MAIL_THREADS_PAGE_SIZE <= cachedCount) return;

  await syncGmailForUser(userId, { mode: 'backfill' });
}
