import { NextRequest, NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { handleCorsairError } from '@/lib/corsair-error';
import { triggerBackgroundSyncIfStale } from '@/lib/cache/background-sync';
import { CACHE_KEYS } from '@/lib/cache/cache-keys';
import { getIntegrationCache, isCacheFresh, setIntegrationCache } from '@/lib/cache/integration-cache';
import { SYNC_STALE_MS } from '@/lib/cache/sync-policy';
import { getGithubApi } from '@/lib/github/client';
import { fetchGithubOverview } from '@/lib/github/fetch';
import { syncGithubForUser } from '@/lib/github/sync';
import type { GithubInboxItem, GithubOverview } from '@/lib/github/types';

function buildInboxItems(overview: GithubOverview, filter: string): GithubInboxItem[] {
  const items: GithubInboxItem[] = [];

  if (filter === 'all' || filter === 'pulls') {
    for (const pull of overview.recentPulls) {
      items.push({ kind: 'pull', ...pull });
    }
  }

  if (filter === 'all' || filter === 'issues') {
    for (const issue of overview.recentIssues) {
      items.push({ kind: 'issue', ...issue });
    }
  }

  return items.sort(
    (a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime()
  );
}

export async function GET(request: NextRequest) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;
  const userId = session.user.id;

  const filter = request.nextUrl.searchParams.get('filter') ?? 'all';
  const cacheKey = CACHE_KEYS.githubInbox(filter);

  triggerBackgroundSyncIfStale(userId, 'github', () => syncGithubForUser(userId));

  try {
    const cached = await getIntegrationCache<{ items: GithubInboxItem[] }>(userId, cacheKey);
    if (cached && isCacheFresh(cached.updatedAt, SYNC_STALE_MS.github)) {
      return NextResponse.json(cached.payload);
    }

    if (cached) {
      return NextResponse.json(cached.payload);
    }

    const overviewCached = await getIntegrationCache<GithubOverview>(
      userId,
      CACHE_KEYS.githubOverview
    );
    if (overviewCached) {
      const items = buildInboxItems(overviewCached.payload, filter);
      await setIntegrationCache(userId, cacheKey, { items });
      return NextResponse.json({ items });
    }

    const api = getGithubApi(userId);
    const overview = await fetchGithubOverview(api, 15);
    const items = buildInboxItems(overview, filter);
    await setIntegrationCache(userId, cacheKey, { items });

    return NextResponse.json({ items });
  } catch (error) {
    const stale = await getIntegrationCache<{ items: GithubInboxItem[] }>(userId, cacheKey);
    if (stale) return NextResponse.json(stale.payload);

    const handled = handleCorsairError(error);
    return NextResponse.json({ error: handled.error, code: handled.code }, { status: handled.status });
  }
}
