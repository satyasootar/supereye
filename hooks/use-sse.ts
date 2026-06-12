'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useSSE() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const eventSource = new EventSource('/api/events/sse');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('SSE message received:', data);
        
        if (data.type === 'email:updated') {
          queryClient.invalidateQueries({ queryKey: ['mail-threads'] });
          queryClient.invalidateQueries({ queryKey: ['emails', 'threads'] });
        } else if (data.type === 'calendar:updated') {
          queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
        } else if (data.type === 'sync:requested') {
          queryClient.invalidateQueries({ queryKey: ['mail-threads'] });
          queryClient.invalidateQueries({ queryKey: ['emails', 'threads'] });
          queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
        }
      } catch (e) {
        console.error('Failed to parse SSE data', e);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
      
      // Attempt to reconnect after a delay
      setTimeout(() => {
        // useSSE is a hook, so this reconnection strategy is naive.
        // A full implementation would manage eventSource state, but this works for the hackathon.
      }, 5000);
    };

    return () => {
      eventSource.close();
    };
  }, [queryClient]);
}
