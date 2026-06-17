import { NextRequest, NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { handleCorsairError } from '@/lib/corsair-error';
import { triggerBackgroundSyncIfStale } from '@/lib/cache/background-sync';
import { CACHE_KEYS } from '@/lib/cache/cache-keys';
import { getIntegrationCache, isCacheFresh, setIntegrationCache } from '@/lib/cache/integration-cache';
import { SYNC_STALE_MS } from '@/lib/cache/sync-policy';
import { getGithubApi } from '@/lib/github/client';
import { buildGithubReposPage } from '@/lib/github/repos-page';
import { syncGithubForUser } from '@/lib/github/sync';
import { GITHUB_REPOS_PAGE_SIZE, type GithubReposPage } from '@/lib/github/types';

function parsePositiveInt(value: string | null, fallback: number, max: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

export async function GET(request: NextRequest) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;
  const userId = session.user.id;

  const page = parsePositiveInt(request.nextUrl.searchParams.get('page'), 1, 100);
  const perPage = parsePositiveInt(
    request.nextUrl.searchParams.get('perPage'),
    GITHUB_REPOS_PAGE_SIZE,
    50
  );
  const cacheKey = CACHE_KEYS.githubRepos(page, perPage);

  triggerBackgroundSyncIfStale(userId, 'github', () => syncGithubForUser(userId));

  try {
    const cached = await getIntegrationCache<GithubReposPage>(userId, cacheKey);
    if (cached && isCacheFresh(cached.updatedAt, SYNC_STALE_MS.github)) {
      return NextResponse.json(cached.payload);
    }

    if (cached) {
      return NextResponse.json(cached.payload);
    }

    const api = getGithubApi(userId);
    const result = await api.repositories.list({
      perPage,
      per_page: perPage,
      page,
      sort: 'updated',
      direction: 'desc',
    });

    const payload = buildGithubReposPage(result, page, perPage);

    await setIntegrationCache(userId, cacheKey, payload);
    return NextResponse.json(payload);
  } catch (error) {
    const stale = await getIntegrationCache<GithubReposPage>(userId, cacheKey);
    if (stale) return NextResponse.json(stale.payload);

    const handled = handleCorsairError(error);
    return NextResponse.json({ error: handled.error, code: handled.code }, { status: handled.status });
  }
}
