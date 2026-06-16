import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { handleCorsairError } from '@/lib/corsair-error';
import { triggerBackgroundSyncIfStale } from '@/lib/cache/background-sync';
import { CACHE_KEYS } from '@/lib/cache/cache-keys';
import { getIntegrationCache, isCacheFresh, setIntegrationCache } from '@/lib/cache/integration-cache';
import { SYNC_STALE_MS } from '@/lib/cache/sync-policy';
import { getGithubApi } from '@/lib/github/client';
import { fetchGithubOverview } from '@/lib/github/fetch';
import { syncGithubForUser } from '@/lib/github/sync';
import type { GithubOverview } from '@/lib/github/types';

export async function GET() {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;
  const userId = session.user.id;

  triggerBackgroundSyncIfStale(userId, 'github', () => syncGithubForUser(userId));

  try {
    const cached = await getIntegrationCache<GithubOverview>(userId, CACHE_KEYS.githubOverview);
    if (cached && isCacheFresh(cached.updatedAt, SYNC_STALE_MS.github)) {
      return NextResponse.json(cached.payload);
    }

    if (cached) {
      return NextResponse.json(cached.payload);
    }

    const api = getGithubApi(userId);
    const overview = await fetchGithubOverview(api);
    await setIntegrationCache(userId, CACHE_KEYS.githubOverview, overview);
    return NextResponse.json(overview);
  } catch (error) {
    const stale = await getIntegrationCache<GithubOverview>(userId, CACHE_KEYS.githubOverview);
    if (stale) return NextResponse.json(stale.payload);

    const handled = handleCorsairError(error);
    return NextResponse.json({ error: handled.error, code: handled.code }, { status: handled.status });
  }
}
