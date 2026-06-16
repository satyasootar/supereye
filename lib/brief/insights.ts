import { and, eq, isNull, gte, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { emails } from '@/lib/db/schema';
import { classifyEmailInsight } from './classify';

export async function ensureEmailInsightsForUser(userId: string, limit = 40): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const rows = await db
    .select()
    .from(emails)
    .where(
      and(
        eq(emails.userId, userId),
        isNull(emails.insightClassifiedAt),
        eq(emails.isArchived, false),
        gte(emails.internalDate, since),
        sql`(${emails.labelIds} @> '["INBOX"]'::jsonb OR ${emails.labelIds} IS NULL)`
      )
    )
    .orderBy(sql`${emails.internalDate} DESC`)
    .limit(limit);

  let updated = 0;
  const now = new Date();

  for (const row of rows) {
    const result = classifyEmailInsight({
      subject: row.subject || '',
      from: row.fromAddress || '',
      snippet: row.snippet || '',
      body: row.body || '',
    });

    await db
      .update(emails)
      .set({
        insightCategory: result.category,
        insightSummary: result.summary,
        extractedLinks: result.links,
        extractedOtps: result.otps,
        insightClassifiedAt: now,
        updatedAt: now,
      })
      .where(and(eq(emails.userId, userId), eq(emails.googleMessageId, row.googleMessageId)));

    updated += 1;
  }

  return updated;
}
