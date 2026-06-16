import { db } from '@/lib/db';
import { syncState } from '@/lib/db/schema';
import { sseEmitter } from '@/lib/sse/emitter';
import { getDriveApi } from '@/lib/drive/client';
import { fetchDriveRecent } from '@/lib/drive/fetch';

export async function syncDriveForUser(userId: string) {
  const api = getDriveApi(userId);
  const overview = await fetchDriveRecent(api);

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
