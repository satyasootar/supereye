'use client';

import { useCallback, useEffect, useRef } from 'react';

export function useInfiniteScroll({
  enabled,
  onLoadMore,
  rootRef,
  watchKey,
}: {
  enabled: boolean;
  onLoadMore: () => void;
  rootRef: React.RefObject<HTMLElement | null>;
  /** Re-attach when list content changes (e.g. repo count). */
  watchKey?: number | string;
}) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const setSentinelRef = useCallback((node: HTMLDivElement | null) => {
    sentinelRef.current = node;
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const sentinel = sentinelRef.current;
    if (!enabled || !root || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { root, rootMargin: '120px', threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [enabled, onLoadMore, rootRef, watchKey]);

  return setSentinelRef;
}
