import { and, eq, gte, sum } from 'drizzle-orm';
import { db } from '@/lib/db';
import { aiUsageEvents } from '@/lib/db/schema';

export async function getAiTokensUsedSince(
  userId: string,
  since: Date | null | undefined
): Promise<number> {
  const conditions = [eq(aiUsageEvents.userId, userId)];
  if (since) {
    conditions.push(gte(aiUsageEvents.createdAt, since));
  }

  const [row] = await db
    .select({ total: sum(aiUsageEvents.totalTokens) })
    .from(aiUsageEvents)
    .where(and(...conditions));

  return Number(row?.total ?? 0);
}
