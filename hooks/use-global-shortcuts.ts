'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { getPlugin } from '@/lib/plugins/registry';

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  );
}

export function useGlobalShortcuts() {
  const { openTab } = useAppStore();
  const { workspaces, switchWorkspace, focusPlugin, activeWorkspace } = useWorkspaces();

  useEffect(() => {
    let keyBuffer: string[] = [];
    let bufferTimer: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

      const mod = e.metaKey || e.ctrlKey;

      // Ctrl/Cmd+1..9 — switch workspace
      if (mod && !e.shiftKey && !e.altKey && /^[1-9]$/.test(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        const ws = workspaces[index];
        if (ws) {
          e.preventDefault();
          switchWorkspace(ws.id);
        }
        return;
      }

      // Ctrl/Cmd+Shift+1..2 — focus plugin in active workspace
      if (mod && e.shiftKey && /^[1-2]$/.test(e.key) && activeWorkspace) {
        const index = parseInt(e.key, 10) - 1;
        const pluginId = activeWorkspace.pluginIds[index];
        if (pluginId) {
          e.preventDefault();
          focusPlugin(pluginId);
        }
        return;
      }

      const key = e.key.toUpperCase();
      keyBuffer.push(key);
      const combo = keyBuffer.join('');

      if (combo.includes('GE')) {
        e.preventDefault();
        openTab('email');
        keyBuffer = [];
      } else if (combo.includes('GK')) {
        e.preventDefault();
        openTab('email');
        const cal = activeWorkspace?.pluginIds.find((id) => id === 'calendar');
        if (cal) focusPlugin('calendar');
        else useAppStore.getState().setWorkspaceMode('calendar');
        keyBuffer = [];
      } else if (combo.includes('GI')) {
        e.preventDefault();
        openTab('email');
        keyBuffer = [];
      }

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
  }, [openTab, workspaces, switchWorkspace, focusPlugin, activeWorkspace]);

  return null;
}
