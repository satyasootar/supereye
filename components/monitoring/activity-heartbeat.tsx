'use client';

import { useEffect } from 'react';

const HEARTBEAT_MS = 60_000;

export function ActivityHeartbeat() {
  useEffect(() => {
    const ping = () => {
      if (document.visibilityState === 'hidden') return;
      void fetch('/api/user/activity/heartbeat', { method: 'POST' }).catch(() => {});
    };

    ping();
    const interval = window.setInterval(ping, HEARTBEAT_MS);
    const onVisible = () => ping();
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return null;
}
