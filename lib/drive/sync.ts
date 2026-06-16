import { db } from '@/lib/db';
import { syncState } from '@/lib/db/schema';
import { sseEmitter } from '@/lib/sse/emitter';
import { CACHE_KEYS } from '@/lib/cache/cache-keys';
import { setIntegrationCache } from '@/lib/cache/integration-cache';
import { getDriveApi } from '@/lib/drive/client';
import { fetchDriveRecent, listDriveFolder } from '@/lib/drive/fetch';
import type { DriveRecentOverview } from '@/lib/drive/types';

export async function syncDriveForUser(userId: string) {
  const api = getDriveApi(userId);
  const overview = await fetchDriveRecent(api);

  await setIntegrationCache<DriveRecentOverview>(userId, CACHE_KEYS.driveRecent, overview);

  const rootBrowse = await listDriveFolder(api, 'root');
  await setIntegrationCache(userId, CACHE_KEYS.driveFolder('root'), rootBrowse);

  sseEmitter.emit(userId, { type: 'drive:updated' });

  await db
    .insert(syncState)
    .values({
      userId,
      provider: 'googledrive',
      lastSyncedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [syncState.userId, syncState.provider],
      set: { lastSyncedAt: new Date() },
    });

  return { success: true, count: overview.recent.length };
}
