import { generateObject } from 'ai';
import { z } from 'zod';
import { db } from '@/lib/db';
import { emails } from '@/lib/db/schema';
import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { getTriageModel } from '@/lib/agent/triage-model';
import { sseEmitter } from '@/lib/sse/emitter';
import {
  stripHtml,
  truncateText,
} from '@/lib/mail/priority';

const classificationSchema = z.object({
  tier: z.enum(['urgent', 'can_wait']),
  score: z.number().min(0).max(100),
  reason: z.string().max(200),
});

export type EmailClassification = z.infer<typeof classificationSchema>;

function isInboxEmail(labelIds: string[] | null | undefined): boolean {
  if (!labelIds || labelIds.length === 0) return true;
  return labelIds.includes('INBOX');
}

export async function classifyEmailContent(input: {
  subject: string;
  from: string;
  snippet: string;
  bodyPreview: string;
}): Promise<{ classification: EmailClassification; usage: unknown }> {
  const { object, usage } = await generateObject({
    model: getTriageModel(),
    schema: classificationSchema,
    prompt: `You triage incoming email for a busy professional. Classify as urgent or can_wait.

urgent — needs attention soon: deadlines, direct asks, time-sensitive meetings, blockers, security/account issues, replies expected today, from manager/client on active work.
can_wait — newsletters, promos, FYI updates, automated notifications, social, no action needed soon.

Return JSON only with tier, score (0-100, higher = more urgent), and reason (one short sentence).

Subject: ${input.subject || '(No subject)'}
From: ${input.from || 'Unknown'}
Snippet: ${input.snippet || '(empty)'}
Body preview: ${input.bodyPreview || '(empty)'}`,
  });

  return { classification: object, usage };
}

async function classifyAndPersistEmail(
  userId: string,
  row: typeof emails.$inferSelect
): Promise<EmailClassification | null> {
  if (row.priorityTier) return null;

  const bodyPreview = truncateText(
    stripHtml(row.body || row.snippet || ''),
    600
  );

  try {
    const { classification: result, usage } = await classifyEmailContent({
      subject: row.subject || '',
      from: row.fromAddress || '',
      snippet: row.snippet || '',
      bodyPreview,
    });

    await db
      .update(emails)
      .set({
        priorityTier: result.tier,
        priorityScore: result.score,
        priorityReason: result.reason,
        priorityClassifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(emails.userId, userId), eq(emails.googleMessageId, row.googleMessageId)));

    void import('@/lib/usage/log-usage').then(({ logAiUsage }) =>
      logAiUsage(userId, {
        feature: 'email_triage',
        usage: usage as any,
        metadata: { googleMessageId: row.googleMessageId, tier: result.tier },
      })
    );

    return result;
  } catch (error) {
    console.error('Email triage failed for', row.googleMessageId, error);
    return null;
  }
}

export async function triageEmailByGoogleId(
  userId: string,
  googleMessageId: string
): Promise<EmailClassification | null> {
  const [row] = await db
    .select()
    .from(emails)
    .where(
      and(eq(emails.userId, userId), eq(emails.googleMessageId, googleMessageId))
    )
    .limit(1);

  if (!row || row.priorityTier) return null;
  return classifyAndPersistEmail(userId, row);
}

export async function triageNewEmailsForUser(
  userId: string,
  googleMessageIds: string[]
): Promise<number> {
  if (googleMessageIds.length === 0) return 0;

  const rows = await db
    .select()
    .from(emails)
    .where(
      and(
        eq(emails.userId, userId),
        inArray(emails.googleMessageId, googleMessageIds),
        isNull(emails.priorityTier)
      )
    );

  const inboxUnread = rows.filter(
    (row) => !row.isRead && isInboxEmail(row.labelIds as string[] | null)
  );

  let classified = 0;
  for (const row of inboxUnread.slice(0, 10)) {
    const result = await classifyAndPersistEmail(userId, row);
    if (result) classified += 1;
  }

  if (classified > 0) {
    sseEmitter.emit(userId, { type: 'email:triage' });
  }

  return classified;
}

export async function triagePendingEmailsForUser(
  userId: string,
  limit = 10
): Promise<{ classified: number; pending: number }> {
  const pendingRows = await db
    .select({ googleMessageId: emails.googleMessageId })
    .from(emails)
    .where(
      and(
        eq(emails.userId, userId),
        isNull(emails.priorityTier),
        eq(emails.isRead, false),
        eq(emails.isArchived, false),
        sql`(${emails.labelIds} @> '["INBOX"]'::jsonb OR ${emails.labelIds} IS NULL)`
      )
    )
    .orderBy(sql`${emails.internalDate} DESC`)
    .limit(limit);

  let classified = 0;
  for (const { googleMessageId } of pendingRows) {
    const result = await triageEmailByGoogleId(userId, googleMessageId);
    if (result) classified += 1;
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(emails)
    .where(
      and(
        eq(emails.userId, userId),
        isNull(emails.priorityTier),
        eq(emails.isRead, false),
        eq(emails.isArchived, false),
        sql`(${emails.labelIds} @> '["INBOX"]'::jsonb OR ${emails.labelIds} IS NULL)`
      )
    );

  if (classified > 0) {
    sseEmitter.emit(userId, { type: 'email:triage' });
  }

  return { classified, pending: count ?? 0 };
}

export async function getTriageSummary(userId: string) {
  const [urgentRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(emails)
    .where(
      and(
        eq(emails.userId, userId),
        eq(emails.priorityTier, 'urgent'),
        eq(emails.isRead, false),
        eq(emails.isArchived, false),
        sql`(${emails.labelIds} @> '["INBOX"]'::jsonb OR ${emails.labelIds} IS NULL)`
      )
    );

  const [canWaitRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(emails)
    .where(
      and(
        eq(emails.userId, userId),
        eq(emails.priorityTier, 'can_wait'),
        eq(emails.isRead, false),
        eq(emails.isArchived, false),
        sql`(${emails.labelIds} @> '["INBOX"]'::jsonb OR ${emails.labelIds} IS NULL)`
      )
    );

  const [pendingRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(emails)
    .where(
      and(
        eq(emails.userId, userId),
        isNull(emails.priorityTier),
        eq(emails.isRead, false),
        eq(emails.isArchived, false),
        sql`(${emails.labelIds} @> '["INBOX"]'::jsonb OR ${emails.labelIds} IS NULL)`
      )
    );

  return {
    urgent: urgentRow?.count ?? 0,
    canWait: canWaitRow?.count ?? 0,
    pending: pendingRow?.count ?? 0,
  };
}
