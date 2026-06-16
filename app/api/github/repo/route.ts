import { NextRequest, NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { handleCorsairError } from '@/lib/corsair-error';
import { CACHE_KEYS } from '@/lib/cache/cache-keys';
import { getIntegrationCache, isCacheFresh, setIntegrationCache } from '@/lib/cache/integration-cache';
import { SYNC_STALE_MS } from '@/lib/cache/sync-policy';
import { getGithubApi } from '@/lib/github/client';
import { fetchGithubRepoBundle } from '@/lib/github/fetch';
import type { GithubRepoBundle } from '@/lib/github/types';

export async function GET(request: NextRequest) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;
  const userId = session.user.id;

  const owner = request.nextUrl.searchParams.get('owner');
  const repo = request.nextUrl.searchParams.get('repo');

  if (!owner || !repo) {
    return NextResponse.json({ error: 'owner and repo are required' }, { status: 400 });
  }

  const cacheKey = CACHE_KEYS.githubRepo(owner, repo);

  try {
    const cached = await getIntegrationCache<GithubRepoBundle>(userId, cacheKey);
    if (cached && isCacheFresh(cached.updatedAt, SYNC_STALE_MS.github)) {
      return NextResponse.json(cached.payload);
    }

    const api = getGithubApi(userId);
    const bundle = await fetchGithubRepoBundle(api, owner, repo);
    await setIntegrationCache(userId, cacheKey, bundle);

    return NextResponse.json(bundle);
  } catch (error) {
    const stale = await getIntegrationCache<GithubRepoBundle>(userId, cacheKey);
    if (stale) return NextResponse.json(stale.payload);

    const handled = handleCorsairError(error);
    return NextResponse.json({ error: handled.error, code: handled.code }, { status: handled.status });
  }
}
