'use client';

import { cn } from '@/lib/utils';
import { useKeyboardStore } from '@/lib/keyboard/keyboard-store';

export function ModeIndicator() {
  const { focusMode, sequenceLabel } = useKeyboardStore();

  const modeLabel =
    focusMode === 'insert'
      ? 'INSERT'
      : focusMode === 'modal'
        ? 'MODAL'
        : 'COMMAND';

  const modeSymbol =
    focusMode === 'insert' ? '◎' : focusMode === 'modal' ? '◆' : '●';

  return (
    <div
      className="pointer-events-none fixed bottom-3 left-1/2 z-[180] flex -translate-x-1/2 items-center gap-2 rounded-full border border-border-subtle bg-bg-elevated/95 px-3 py-1.5 text-[11px] font-medium text-text-muted shadow-lg backdrop-blur-md"
      aria-live="polite"
    >
      <span
        className={cn(
          'font-mono',
          focusMode === 'command' && 'text-accent-blue',
          focusMode === 'insert' && 'text-amber-500',
          focusMode === 'modal' && 'text-violet-400'
        )}
      >
        {modeSymbol} {modeLabel}
      </span>
      {sequenceLabel && (
        <>
          <span className="text-border-strong">|</span>
          <span className="font-mono text-text-secondary">{sequenceLabel}</span>
        </>
      )}
    </div>
  );
}
