'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { registerActionHandler } from '@/lib/keyboard/action-handlers';
import { KEYBOARD_ACTIONS } from '@/lib/keyboard/action-ids';

function focusAgentInput() {
  window.dispatchEvent(new CustomEvent('agent:focus-input'));
}

export function useAgentKeybindings() {
  useEffect(() => {
    const unsubs = [
      registerActionHandler(KEYBOARD_ACTIONS.AGENT_TOGGLE, () => {
        const { isAgentOpen, setAgentOpen } = useAppStore.getState();
        const next = !isAgentOpen;
        setAgentOpen(next);
        if (next) focusAgentInput();
      }),
      registerActionHandler(KEYBOARD_ACTIONS.AGENT_NEW_CHAT, () => {
        const { isAgentExecuting, setAgentOpen, startNewAgentThread } =
          useAppStore.getState();
        if (isAgentExecuting) return;
        startNewAgentThread();
        setAgentOpen(true);
        focusAgentInput();
      }),
    ];

    return () => unsubs.forEach((u) => u());
  }, []);
}
