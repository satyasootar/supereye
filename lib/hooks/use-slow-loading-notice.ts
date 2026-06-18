'use client';

import { useEffect, useState } from 'react';

const DEFAULT_DELAY_MS = 5000;

/**
 * Returns true once `isLoading` has been true for at least `delayMs`.
 * Resets immediately when loading finishes.
 */
export function useSlowLoadingNotice(
  isLoading: boolean,
  delayMs: number = DEFAULT_DELAY_MS,
): boolean {
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShowNotice(false);
      return;
    }

    const timer = window.setTimeout(() => setShowNotice(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [isLoading, delayMs]);

  return showNotice;
}
