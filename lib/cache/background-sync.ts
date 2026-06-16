import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { syncState } from '@/lib/db/schema';
import type { SyncProvider } from './sync-policy';
import { SYNC_STALE_MS } from './sync-policy';

export async function getLastSyncedAt(
  userId: string,
  provider: SyncProvider
): Promise<Date | null> {
  const [row] = await db
    .select({ lastSyncedAt: syncState.lastSyncedAt })
    .from(syncState)
    .where(and(eq(syncState.userId, userId), eq(syncState.provider, provider)))
    .limit(1);

  return row?.lastSyncedAt ?? null;
}

export function isSyncStale(lastSyncedAt: Date | null, provider: SyncProvider): boolean {
  if (!lastSyncedAt) return true;
  return Date.now() - lastSyncedAt.getTime() > SYNC_STALE_MS[provider];
}

/** Fire-and-forget sync when data is stale — never blocks the read path. */
export function triggerBackgroundSyncIfStale(
  userId: string,
  provider: SyncProvider,
  syncFn: () => Promise<unknown>
): void {
  void (async () => {
    try {
      const lastSyncedAt = await getLastSyncedAt(userId, provider);
      if (!isSyncStale(lastSyncedAt, provider)) return;
      await syncFn();
    } catch (error) {
      console.error(`[${provider}] background sync failed:`, error);
    }
  })();
}
