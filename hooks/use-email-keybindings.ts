'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { registerActionHandler } from '@/lib/keyboard/action-handlers';
import { KEYBOARD_ACTIONS } from '@/lib/keyboard/action-ids';

/** Email-scoped bindings — list/reader hooks via custom events */
export function useEmailKeybindings() {
  const { setSelectedEmailId } = useAppStore();

  useEffect(() => {
    const unsubs = [
      registerActionHandler(KEYBOARD_ACTIONS.EMAIL_NEXT, () => {
        window.dispatchEvent(new CustomEvent('supereye:email-next'));
      }),
      registerActionHandler(KEYBOARD_ACTIONS.EMAIL_PREV, () => {
        window.dispatchEvent(new CustomEvent('supereye:email-prev'));
      }),
      registerActionHandler(KEYBOARD_ACTIONS.EMAIL_OPEN, () => {
        window.dispatchEvent(new CustomEvent('supereye:email-open'));
      }),
      registerActionHandler(KEYBOARD_ACTIONS.EMAIL_CLOSE, () => {
        setSelectedEmailId(null);
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, [setSelectedEmailId]);
}
