'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { registerActionHandler } from '@/lib/keyboard/action-handlers';
import { KEYBOARD_ACTIONS } from '@/lib/keyboard/action-ids';
import { useKeyboardStore } from '@/lib/keyboard/keyboard-store';

export function useWorkspaceKeybindings() {
  const { setCommandPaletteOpen } = useAppStore();
  const { workspaces, switchWorkspace, focusPlugin, activeWorkspace, layout } =
    useWorkspaces();
  const { setCheatSheetOpen, setActivePanel } = useKeyboardStore();

  useEffect(() => {
    const panel =
      layout.primary === 'calendar'
        ? 'calendar'
        : layout.primary === 'email'
          ? 'email'
          : 'workspace';
    setActivePanel(panel);
  }, [layout.primary, setActivePanel]);

  useEffect(() => {
    const unsubs = [
      registerActionHandler(KEYBOARD_ACTIONS.OPEN_COMMAND_PALETTE, () => {
        const open = useAppStore.getState().isCommandPaletteOpen;
        setCommandPaletteOpen(!open);
      }),
      registerActionHandler(KEYBOARD_ACTIONS.OPEN_CHEAT_SHEET, () => {
        setCheatSheetOpen(true);
      }),
      registerActionHandler(KEYBOARD_ACTIONS.WORKSPACE_SWITCH, (bindingId) => {
        const index = parseInt(bindingId.split('.').pop() ?? '0', 10) - 1;
        const ws = workspaces[index];
        if (ws) switchWorkspace(ws.id);
      }),
      registerActionHandler(KEYBOARD_ACTIONS.WORKSPACE_CYCLE_NEXT, () => {
        if (workspaces.length < 2 || !activeWorkspace) return;
        const idx = workspaces.findIndex((w) => w.id === activeWorkspace.id);
        const next = workspaces[(idx + 1) % workspaces.length];
        switchWorkspace(next.id);
      }),
      registerActionHandler(KEYBOARD_ACTIONS.WORKSPACE_CYCLE_PREV, () => {
        if (workspaces.length < 2 || !activeWorkspace) return;
        const idx = workspaces.findIndex((w) => w.id === activeWorkspace.id);
        const prev =
          workspaces[(idx - 1 + workspaces.length) % workspaces.length];
        switchWorkspace(prev.id);
      }),
      registerActionHandler(KEYBOARD_ACTIONS.WORKSPACE_CYCLE_PLUGIN, () => {
        if (!activeWorkspace || activeWorkspace.pluginIds.length < 2) return;
        const current = layout.primary;
        const other = activeWorkspace.pluginIds.find((id) => id !== current);
        if (other) {
          focusPlugin(other);
          setActivePanel(other === 'calendar' ? 'calendar' : 'email');
        }
      }),
    ];

    return () => unsubs.forEach((u) => u());
  }, [
    workspaces,
    activeWorkspace,
    layout.primary,
    switchWorkspace,
    focusPlugin,
    setCommandPaletteOpen,
    setCheatSheetOpen,
    setActivePanel,
  ]);
}
