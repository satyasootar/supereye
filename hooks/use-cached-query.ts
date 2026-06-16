'use client';

import {
  useQuery,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { queryKeyToCacheKey, useDataCacheStore } from '@/lib/store/data-cache-store';
import { CLIENT_CACHE_STALE_MS } from '@/lib/cache/sync-policy';

type CachedQueryOptions<T> = Omit<
  UseQueryOptions<T, Error, T, QueryKey>,
  'queryKey' | 'queryFn'
> & {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
  /** Override default client stale time (ms). */
  clientStaleMs?: number;
};

/**
 * React Query + Zustand bridge.
 * - Serves cached data instantly on remount (no duplicate fetch while fresh).
 * - SSE invalidation marks namespace stale → next mount refetches.
 */
export function useCachedQuery<T>({
  queryKey,
  queryFn,
  staleTime = CLIENT_CACHE_STALE_MS.default,
  gcTime = 30 * 60_000,
  clientStaleMs,
  ...options
}: CachedQueryOptions<T>): UseQueryResult<T, Error> {
  const cacheKey = queryKeyToCacheKey(queryKey);
  const cached = useDataCacheStore((s) => s.getEntry<T>(cacheKey));
  const setEntry = useDataCacheStore((s) => s.setEntry);

  const effectiveStaleTime = clientStaleMs ?? staleTime;

  return useQuery<T, Error>({
    queryKey,
    queryFn: async () => {
      const data = await queryFn();
      setEntry(cacheKey, data);
      return data;
    },
    staleTime: effectiveStaleTime,
    gcTime,
    refetchOnMount: (query) => {
      if (query.state.dataUpdatedAt === 0) return true;
      return Date.now() - query.state.dataUpdatedAt > effectiveStaleTime;
    },
    ...(cached
      ? {
          initialData: cached.data,
          initialDataUpdatedAt: cached.fetchedAt,
        }
      : {}),
    ...options,
  });
}
