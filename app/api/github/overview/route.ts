import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { handleCorsairError } from '@/lib/corsair-error';
import { triggerBackgroundSyncIfStale } from '@/lib/cache/background-sync';
import { CACHE_KEYS } from '@/lib/cache/cache-keys';
import { getIntegrationCache, isCacheFresh, setIntegrationCache } from '@/lib/cache/integration-cache';
import { SYNC_STALE_MS } from '@/lib/cache/sync-policy';
import { hasGithubAccessToken, isAuthMissingError } from '@/lib/github/auth';
import { getGithubApi } from '@/lib/github/client';
import { fetchGithubOverview } from '@/lib/github/fetch';
import { fetchGithubProfileBundle } from '@/lib/github/profile';
import { getGithubStaleCache } from '@/lib/github/cache-policy';
import { syncGithubForUser } from '@/lib/github/sync';
import type { GithubOverview } from '@/lib/github/types';

export async function GET() {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;
  const userId = session.user.id;

  triggerBackgroundSyncIfStale(userId, 'github', () => syncGithubForUser(userId));

  const cached = await getIntegrationCache<GithubOverview>(userId, CACHE_KEYS.githubOverview);
  const authReady = await hasGithubAccessToken(userId);

  if (cached && isCacheFresh(cached.updatedAt, SYNC_STALE_MS.github) && cached.payload.profile) {
    return NextResponse.json({ ...cached.payload, authReady });
  }

  if (!authReady) {
    return NextResponse.json({
      profile: null,
      repos: [],
      stats: { repoCount: 0, openPulls: 0, openIssues: 0, recentCommits: 0 },
      recentPulls: [],
      recentIssues: [],
      recentCommits: [],
      repoStats: {},
      authReady: false,
    } satisfies GithubOverview & { authReady: boolean });
  }

  try {
    const api = getGithubApi(userId);

    if (cached && !cached.payload.profile) {
      const profile = await fetchGithubProfileBundle(api, userId);
      if (profile) {
        const updated: GithubOverview = { ...cached.payload, profile };
        await setIntegrationCache(userId, CACHE_KEYS.githubOverview, updated);
        return NextResponse.json({ ...updated, authReady: true });
      }
    }

    if (cached) {
      return NextResponse.json({ ...cached.payload, authReady: true });
    }

    const overview = await fetchGithubOverview(api, 12, userId);
    await setIntegrationCache(userId, CACHE_KEYS.githubOverview, overview);
    return NextResponse.json({ ...overview, authReady: true });
  } catch (error) {
    if (isAuthMissingError(error)) {
      return NextResponse.json(
        {
          error: 'GitHub session expired. Reconnect GitHub in Settings → Connections.',
          code: 'AUTH_EXPIRED',
          authReady: false,
        },
        { status: 401 }
      );
    }

    const stale = await getGithubStaleCache<GithubOverview>(userId, CACHE_KEYS.githubOverview);
    if (stale) {
      return NextResponse.json({ ...stale, authReady: true });
    }

    const handled = handleCorsairError(error);
    return NextResponse.json({ error: handled.error, code: handled.code }, { status: handled.status });
  }
}
