'use client';

import { useEffect } from 'react';
import { resolveFocusMode } from '@/lib/keyboard/focus-context';
import { useKeyboardStore } from '@/lib/keyboard/keyboard-store';

export function FocusContextProvider({ children }: { children: React.ReactNode }) {
  const { modalDepth, setFocusMode } = useKeyboardStore();

  useEffect(() => {
    const sync = () => {
      setFocusMode(resolveFocusMode(document.activeElement, modalDepth));
    };

    document.addEventListener('focusin', sync, true);
    document.addEventListener('focusout', sync, true);
    sync();

    return () => {
      document.removeEventListener('focusin', sync, true);
      document.removeEventListener('focusout', sync, true);
    };
  }, [modalDepth, setFocusMode]);

  return <>{children}</>;
}
