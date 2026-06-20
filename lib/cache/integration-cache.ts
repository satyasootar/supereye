import { and, eq, like } from 'drizzle-orm';
import { db } from '@/lib/db';
import { integrationCache } from '@/lib/db/schema';

export type CachedPayload<T> = {
  payload: T;
  updatedAt: Date;
};

export async function getIntegrationCache<T>(
  userId: string,
  cacheKey: string
): Promise<CachedPayload<T> | null> {
  const [row] = await db
    .select({
      payload: integrationCache.payload,
      updatedAt: integrationCache.updatedAt,
    })
    .from(integrationCache)
    .where(and(eq(integrationCache.userId, userId), eq(integrationCache.cacheKey, cacheKey)))
    .limit(1);

  if (!row) return null;
  return { payload: row.payload as T, updatedAt: row.updatedAt };
}

export async function setIntegrationCache<T>(
  userId: string,
  cacheKey: string,
  payload: T
): Promise<void> {
  const now = new Date();
  await db
    .insert(integrationCache)
    .values({
      userId,
      cacheKey,
      payload: payload as Record<string, unknown>,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [integrationCache.userId, integrationCache.cacheKey],
      set: {
        payload: payload as Record<string, unknown>,
        updatedAt: now,
      },
    });
}

export function isCacheFresh(updatedAt: Date, staleMs: number): boolean {
  return Date.now() - updatedAt.getTime() < staleMs;
}

export async function clearIntegrationCacheByPrefix(
  userId: string,
  cacheKeyPrefix: string
): Promise<number> {
  const deleted = await db
    .delete(integrationCache)
    .where(
      and(
        eq(integrationCache.userId, userId),
        like(integrationCache.cacheKey, `${cacheKeyPrefix}%`)
      )
    )
    .returning({ cacheKey: integrationCache.cacheKey });

  return deleted.length;
}
