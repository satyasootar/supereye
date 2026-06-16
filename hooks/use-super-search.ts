'use client';

import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/lib/hooks/use-debounce';
import type { SuperSearchResponse } from '@/lib/search/types';

export function useSuperSearch(query: string, enabled: boolean) {
  const debounced = useDebounce(query.trim(), 200);

  return useQuery<SuperSearchResponse>({
    queryKey: ['super-search', debounced],
    queryFn: async () => {
      const params = new URLSearchParams({ q: debounced });
      const res = await fetch(`/api/search/workspace?${params}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(typeof json.error === 'string' ? json.error : 'Search failed');
      }
      return res.json();
    },
    enabled: enabled && debounced.length >= 2,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}
