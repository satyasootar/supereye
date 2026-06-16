'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateClientCacheNamespaces } from '@/lib/store/data-cache-store';
import { SSE_INVALIDATION_MAP } from '@/lib/sse/events';
import type { SSEEventType } from '@/lib/sse/events';

/**
 * SSE hook with automatic reconnection and centralized event handling.
 *
 * Instead of a growing if/else chain, this hook uses the SSE_INVALIDATION_MAP
 * to automatically invalidate the right React Query keys when events arrive.
 * When you add a new integration, just add its event type + query keys to
 * the map in lib/sse/events.ts — zero changes needed here.
 */
export function useSSE() {
  const queryClient = useQueryClient();
  const retryDelay = useRef(1000);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let isMounted = true;

    function connect() {
      if (!isMounted) return;

      eventSource = new EventSource('/api/events/sse');
      retryDelay.current = 1000; // Reset on successful connection attempt

      eventSource.onopen = () => {
        console.log('[SSE] Connected to event stream.');
        retryDelay.current = 1000; // Reset backoff on successful connect
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[SSE] Received event:', data);
          const eventType = data.type as SSEEventType;

          // Invalidate all query keys mapped to this event type
          const queryKeys = SSE_INVALIDATION_MAP[eventType];
          if (queryKeys) {
            invalidateClientCacheNamespaces(queryKeys.cacheNamespaces);
            for (const key of queryKeys.queryKeys) {
              console.log(`[SSE] Invalidating query key:`, key);
              queryClient.invalidateQueries({ queryKey: key });
            }
          }

          // Special handling for toast notifications
          if (eventType === 'notification:new' && data.data) {
            import('sonner').then(({ toast }) => {
              const notif = data.data;
              if (!notif) return;
              toast(notif.title as string, {
                description: notif.body as string,
                action: {
                  label: 'View',
                  onClick: () => {
                    if (notif.link) {
                      window.location.hash = notif.link as string;
                    }
                  }
                }
              });
            });
          }
        } catch (e) {
          console.error('[SSE] Failed to parse SSE data', e);
        }
      };

      eventSource.onerror = (err) => {
        console.warn('[SSE] EventSource connection closed or reconnecting...', err);
        eventSource?.close();
        eventSource = null;

        if (!isMounted) return;

        // Exponential backoff reconnection: 1s → 2s → 4s → ... → 30s max
        retryTimer.current = setTimeout(() => {
          connect();
        }, retryDelay.current);
        retryDelay.current = Math.min(retryDelay.current * 2, 30000);
      };
    }

    connect();

    return () => {
      isMounted = false;
      eventSource?.close();
      if (retryTimer.current) {
        clearTimeout(retryTimer.current);
      }
    };
  }, [queryClient]);
}
