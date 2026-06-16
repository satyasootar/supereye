import { db } from '@/lib/db';
import { syncState } from '@/lib/db/schema';
import { sseEmitter } from '@/lib/sse/emitter';
import { getGithubApi } from '@/lib/github/client';
import { normalizeRepo } from '@/lib/github/normalize';

export async function syncGithubForUser(userId: string) {
  const api = getGithubApi(userId);

  const result = await api.repositories.list({
    perPage: 30,
    sort: 'updated',
    direction: 'desc',
  });

  const repos = Array.isArray(result)
    ? result.map((item) => normalizeRepo(item as Record<string, unknown>))
    : [];

  sseEmitter.emit(userId, { type: 'github:updated' });

  await db
    .insert(syncState)
    .values({
      userId,
      provider: 'github',
      lastSyncedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [syncState.userId, syncState.provider],
      set: { lastSyncedAt: new Date() },
    });

  return { success: true, count: repos.length };
}
