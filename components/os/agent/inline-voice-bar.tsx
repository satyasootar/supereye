'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const BAR_COUNT = 48;

function formatElapsed(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function InlineVoiceBar({
  audioLevel,
  elapsedSec,
  processing = false,
  onCancel,
  onConfirm,
}: {
  audioLevel: number;
  elapsedSec: number;
  processing?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const level = Math.min(1, Math.max(0.06, audioLevel));

  return (
    <div className="flex items-center gap-3 border-t border-border-subtle/80 px-3 py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-[2px] overflow-hidden">
        {Array.from({ length: BAR_COUNT }).map((_, i) => {
          const t = i / BAR_COUNT;
          const envelope = Math.sin(t * Math.PI);
          const jitter = Math.sin(i * 0.7 + elapsedSec * 2) * 0.15;
          const barLevel = level * envelope * (0.65 + jitter);
          const height = 3 + barLevel * 14;
          const opacity = 0.25 + barLevel * 0.75;

          return (
            <motion.div
              key={i}
              className="w-[2px] shrink-0 rounded-full bg-text-muted"
              animate={{ height, opacity }}
              transition={{ duration: 0.08, ease: 'easeOut' }}
            />
          );
        })}
      </div>

      <span className="shrink-0 font-mono text-[12px] tabular-nums text-text-muted">
        {formatElapsed(elapsedSec)}
      </span>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-surface hover:text-text-primary"
          aria-label="Cancel voice input"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path
              d="M3 3L11 11M11 3L3 11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={processing}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
            'bg-accent-blue/15 text-accent-blue hover:bg-accent-blue/25',
            processing && 'opacity-50'
          )}
          aria-label="Done dictating"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path
              d="M2.5 7.5L5.5 10.5L11.5 3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
