'use client';

import { useEffect, useRef } from 'react';
import type { BindingContext, KeyStep } from '@/lib/keyboard/types';
import { dispatchAction } from '@/lib/keyboard/action-handlers';
import { resolveFocusMode, isEditableElement, eventHasModifier, shouldAllowNativeScroll } from '@/lib/keyboard/focus-context';
import {
  keyEventToStep,
  SEQUENCE_TIMEOUT_MS,
  sequenceToLabel,
} from '@/lib/keyboard/key-parser';
import { keybindingRegistry } from '@/lib/keyboard/registry';
import { useKeyboardStore } from '@/lib/keyboard/keyboard-store';

function activeContexts(
  panel: BindingContext,
  modalDepth: number
): BindingContext[] {
  const ctx: BindingContext[] = ['global', 'workspace'];
  if (modalDepth > 0) ctx.push('modal');
  if (panel === 'email') ctx.push('email');
  if (panel === 'calendar') ctx.push('calendar');
  return ctx;
}

function stepHasModifier(step: KeyStep): boolean {
  return !!(step.ctrl || step.meta || step.mod);
}

export function useKeyboardEngine() {
  const bufferRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressedRef = useRef<KeyStep[]>([]);

  const {
    focusMode,
    activePanel,
    modalDepth,
    setFocusMode,
    setSequenceBuffer,
    clearSequence,
  } = useKeyboardStore();

  useEffect(() => {
    const resetBuffer = () => {
      pressedRef.current = [];
      clearSequence();
      if (bufferRef.current) clearTimeout(bufferRef.current);
    };

    const scheduleReset = () => {
      if (bufferRef.current) clearTimeout(bufferRef.current);
      bufferRef.current = setTimeout(resetBuffer, SEQUENCE_TIMEOUT_MS);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as Element | null;
      const mode = resolveFocusMode(document.activeElement, modalDepth);
      if (mode !== focusMode) setFocusMode(mode);

      const step = keyEventToStep(e);
      const contexts = activeContexts(activePanel, modalDepth);

      if (step.key === 'escape' && !eventHasModifier(e)) {
        if (pressedRef.current.length > 0) {
          e.preventDefault();
          resetBuffer();
          return;
        }
        if (mode === 'insert' && isEditableElement(document.activeElement)) {
          (document.activeElement as HTMLElement).blur();
          setFocusMode('command');
          e.preventDefault();
        }
        return;
      }

      if (mode === 'insert' && !eventHasModifier(e)) {
        return;
      }

      if (isEditableElement(target) && !eventHasModifier(e)) return;

      if (!eventHasModifier(e) && shouldAllowNativeScroll(target, step.key)) {
        return;
      }

      const isPrefixContinuation = pressedRef.current.length > 0;

      if (!isPrefixContinuation && stepHasModifier(step)) {
        const match = keybindingRegistry.findMatch([step], contexts, {
          leaderActive: false,
          focusMode: mode,
        });
        if (match) {
          e.preventDefault();
          dispatchAction(match.actionId, match.id, e);
          resetBuffer();
        }
        return;
      }

      if (!isPrefixContinuation) {
        pressedRef.current = [step];
      } else if (!stepHasModifier(step)) {
        pressedRef.current = [...pressedRef.current, step];
      } else {
        return;
      }

      const pressed = pressedRef.current;
      const match = keybindingRegistry.findMatch(pressed, contexts, {
        leaderActive: false,
        focusMode: mode,
      });

      if (match) {
        e.preventDefault();
        dispatchAction(match.actionId, match.id, e);
        resetBuffer();
        return;
      }

      const prefixes = keybindingRegistry.findPrefixMatches(
        pressed,
        contexts,
        false
      );

      if (prefixes.length > 0) {
        e.preventDefault();
        setSequenceBuffer(pressed, sequenceToLabel(pressed) + ' →');
        scheduleReset();
        return;
      }

      resetBuffer();
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      if (bufferRef.current) clearTimeout(bufferRef.current);
    };
  }, [
    activePanel,
    modalDepth,
    focusMode,
    setFocusMode,
    setSequenceBuffer,
    clearSequence,
  ]);
}
