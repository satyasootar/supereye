'use client';

import { useEffect } from 'react';
import { DEFAULT_KEYBINDINGS } from '@/lib/keyboard/default-bindings';
import { keybindingRegistry } from '@/lib/keyboard/registry';
import { FocusContextProvider } from '@/components/keyboard/focus-context-provider';
import { CheatSheet } from '@/components/keyboard/cheat-sheet';
import { useKeyboardEngine } from '@/hooks/use-keyboard-engine';
import { useWorkspaceKeybindings } from '@/hooks/use-workspace-keybindings';
import { useAgentKeybindings } from '@/hooks/use-agent-keybindings';
import { useKeyboardStore } from '@/lib/keyboard/keyboard-store';
import { useAppStore } from '@/lib/store/app-store';

function KeyboardEngineInner() {
  useKeyboardEngine();
  useWorkspaceKeybindings();
  useAgentKeybindings();

  const { isCommandPaletteOpen, isAgentOpen } = useAppStore();
  const { isCheatSheetOpen, hydrateOverridesFromServer, hydrateKeybindingsPreferenceFromServer } =
    useKeyboardStore();

  useEffect(() => {
    keybindingRegistry.register(DEFAULT_KEYBINDINGS);

    void Promise.all([
      hydrateKeybindingsPreferenceFromServer(),
      hydrateOverridesFromServer(),
    ]).then(() => {
      keybindingRegistry.setOverrides(useKeyboardStore.getState().overrides);
    });
  }, [hydrateOverridesFromServer, hydrateKeybindingsPreferenceFromServer]);

  useEffect(() => {
    const anyModalOpen =
      isCommandPaletteOpen || isCheatSheetOpen || isAgentOpen;
    useKeyboardStore.setState({
      modalDepth: anyModalOpen ? 1 : 0,
      focusMode: anyModalOpen ? 'modal' : useKeyboardStore.getState().focusMode === 'insert' ? 'insert' : 'command',
    });
  }, [isCommandPaletteOpen, isCheatSheetOpen, isAgentOpen]);

  return (
    <>
      <CheatSheet />
    </>
  );
}

export function KeyboardSystem({ children }: { children: React.ReactNode }) {
  return (
    <FocusContextProvider>
      {children}
      <KeyboardEngineInner />
    </FocusContextProvider>
  );
}
