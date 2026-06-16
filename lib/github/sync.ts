import { db } from '@/lib/db';
import { syncState } from '@/lib/db/schema';
import { sseEmitter } from '@/lib/sse/emitter';
import { CACHE_KEYS } from '@/lib/cache/cache-keys';
import { setIntegrationCache } from '@/lib/cache/integration-cache';
import { GITHUB_REPOS_PAGE_SIZE } from '@/lib/github/types';
import { getGithubApi } from '@/lib/github/client';
import { fetchGithubOverview } from '@/lib/github/fetch';
import { normalizeRepo } from '@/lib/github/normalize';
import type { GithubReposPage } from '@/lib/github/types';

export async function syncGithubForUser(userId: string) {
  const api = getGithubApi(userId);

  const [reposResult, overview] = await Promise.all([
    api.repositories.list({
      perPage: GITHUB_REPOS_PAGE_SIZE,
      page: 1,
      sort: 'updated',
      direction: 'desc',
    }),
    fetchGithubOverview(api, 8),
  ]);

  const repos = Array.isArray(reposResult)
    ? reposResult.map((item) => normalizeRepo(item as Record<string, unknown>))
    : [];

  const reposPage: GithubReposPage = {
    repos,
    page: 1,
    perPage: GITHUB_REPOS_PAGE_SIZE,
    hasMore: repos.length === GITHUB_REPOS_PAGE_SIZE,
  };

  await Promise.all([
    setIntegrationCache(userId, CACHE_KEYS.githubRepos(1, GITHUB_REPOS_PAGE_SIZE), reposPage),
    setIntegrationCache(userId, CACHE_KEYS.githubOverview, overview),
    setIntegrationCache(userId, CACHE_KEYS.githubInbox('all'), {
      items: [
        ...overview.recentPulls.map((pull) => ({ kind: 'pull' as const, ...pull })),
        ...overview.recentIssues.map((issue) => ({ kind: 'issue' as const, ...issue })),
      ].sort(
        (a, b) =>
          new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime()
      ),
    }),
  ]);

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
