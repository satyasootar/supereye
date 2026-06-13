'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store/app-store';

export function useGlobalShortcuts() {
  const { openTab, isCommandPaletteOpen, setCommandPaletteOpen } = useAppStore();

  useEffect(() => {
    let keyBuffer: string[] = [];
    let bufferTimer: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.getAttribute('contenteditable') === 'true'
      ) {
        return;
      }

      // Add key to buffer for sequential shortcuts (e.g. G + C)
      const key = e.key.toUpperCase();
      keyBuffer.push(key);

      // Check buffer
      const combo = keyBuffer.join('');

      if (combo.includes('GC')) {
        e.preventDefault();
        openTab('chat');
        keyBuffer = [];
      } else if (combo.includes('GE')) {
        e.preventDefault();
        openTab('email');
        keyBuffer = [];
      } else if (combo.includes('GK')) {
        e.preventDefault();
        openTab('email');
        useAppStore.getState().setWorkspaceMode('calendar');
        keyBuffer = [];
      } else if (combo.includes('GI')) {
        e.preventDefault();
        openTab('email');
        keyBuffer = [];
      }

      // Single key shortcuts
      if (keyBuffer.length === 1) {
        switch (key) {
          case '?':
            // Show shortcuts
            break;
        }
      }

      // Clear buffer after 500ms
      clearTimeout(bufferTimer);
      bufferTimer = setTimeout(() => {
        keyBuffer = [];
      }, 500);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(bufferTimer);
    };
  }, [openTab]);

  return null;
}
