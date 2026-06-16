'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useCachedQuery } from '@/hooks/use-cached-query';
import { CLIENT_CACHE_STALE_MS } from '@/lib/cache/sync-policy';
import { GITHUB_REPOS_PAGE_SIZE, type GithubReposPage } from '@/lib/github/types';
import { useDataCacheStore } from '@/lib/store/data-cache-store';

async function fetchReposPage(page: number): Promise<GithubReposPage> {
  const params = new URLSearchParams({
    page: String(page),
    perPage: String(GITHUB_REPOS_PAGE_SIZE),
  });
  const res = await fetch(`/api/github/repos?${params}`);
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(typeof json.error === 'string' ? json.error : 'Failed to load repositories');
  }
  return res.json() as Promise<GithubReposPage>;
}

export function useGithubRepos() {
  const setEntry = useDataCacheStore((s) => s.setEntry);

  const query = useInfiniteQuery({
    queryKey: ['github', 'repos'],
    queryFn: async ({ pageParam }) => {
      const data = await fetchReposPage(pageParam);
      setEntry(JSON.stringify(['github', 'repos', pageParam]), data);
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    staleTime: CLIENT_CACHE_STALE_MS.integration,
    gcTime: 30 * 60_000,
    refetchOnMount: false,
  });

  const repos = query.data?.pages.flatMap((page) => page.repos) ?? [];

  return { ...query, repos };
}

export function useGithubOverview() {
  return useCachedQuery({
    queryKey: ['github', 'overview'],
    queryFn: async () => {
      const res = await fetch('/api/github/overview');
      if (!res.ok) throw new Error('Failed to load GitHub overview');
      return res.json();
    },
    clientStaleMs: CLIENT_CACHE_STALE_MS.integration,
  });
}

export function useGithubInbox(filter: string) {
  return useCachedQuery({
    queryKey: ['github', 'inbox', filter],
    queryFn: async () => {
      const res = await fetch(`/api/github/inbox?filter=${encodeURIComponent(filter)}`);
      if (!res.ok) throw new Error('Failed to load GitHub inbox');
      return res.json();
    },
    clientStaleMs: CLIENT_CACHE_STALE_MS.integration,
  });
}

export function useGithubRepoBundle(owner: string, repo: string, enabled = true) {
  return useCachedQuery({
    queryKey: ['github', 'repo', owner, repo],
    queryFn: async () => {
      const res = await fetch(
        `/api/github/repo?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(typeof json.error === 'string' ? json.error : 'Failed to load repository');
      }
      return res.json();
    },
    enabled: enabled && !!owner && !!repo,
    clientStaleMs: CLIENT_CACHE_STALE_MS.integration,
  });
}

export function useDriveRecent() {
  return useCachedQuery({
    queryKey: ['drive', 'recent'],
    queryFn: async () => {
      const res = await fetch('/api/drive/recent');
      if (!res.ok) throw new Error('Failed to load Drive');
      return res.json();
    },
    clientStaleMs: CLIENT_CACHE_STALE_MS.integration,
  });
}

export function useDriveFolder(folderId: string, enabled = true) {
  return useCachedQuery({
    queryKey: ['drive', 'files', folderId],
    queryFn: async () => {
      const res = await fetch(`/api/drive/files?folderId=${encodeURIComponent(folderId)}`);
      if (!res.ok) throw new Error('Failed to browse folder');
      return res.json();
    },
    enabled,
    clientStaleMs: CLIENT_CACHE_STALE_MS.integration,
  });
}

export function useCalendarEvents() {
  return useCachedQuery<unknown[]>({
    queryKey: ['calendar', 'events'],
    queryFn: async () => {
      const res = await fetch('/api/calendar/events');
      if (!res.ok) throw new Error('Failed to load events');
      const json = await res.json();
      return json.events as unknown[];
    },
    clientStaleMs: CLIENT_CACHE_STALE_MS.calendar,
  });
}
