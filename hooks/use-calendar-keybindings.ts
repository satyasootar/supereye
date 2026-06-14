'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { registerActionHandler } from '@/lib/keyboard/action-handlers';
import { KEYBOARD_ACTIONS } from '@/lib/keyboard/action-ids';

export function useCalendarKeybindings() {
  const { setCurrentDateStr } = useAppStore();

  useEffect(() => {
    const unsubs = [
      registerActionHandler(KEYBOARD_ACTIONS.CAL_TODAY, () => {
        setCurrentDateStr(new Date().toISOString());
      }),
      registerActionHandler(KEYBOARD_ACTIONS.CAL_PREV, () => {
        window.dispatchEvent(new CustomEvent('supereye:calendar-prev'));
      }),
      registerActionHandler(KEYBOARD_ACTIONS.CAL_NEXT, () => {
        window.dispatchEvent(new CustomEvent('supereye:calendar-next'));
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, [setCurrentDateStr]);
}
