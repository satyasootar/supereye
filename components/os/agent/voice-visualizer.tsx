'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type VoiceVisualizerProps = {
  isListening: boolean;
  audioLevel: number;
  interimText: string;
  onStop: () => void;
};

const BAR_COUNT = 12;

export function VoiceVisualizer({
  isListening,
  audioLevel,
  interimText,
  onStop,
}: VoiceVisualizerProps) {
  const level = Math.min(1, Math.max(0.08, audioLevel));

  return (
    <AnimatePresence>
      {isListening && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="pointer-events-auto fixed bottom-[7.5rem] left-1/2 z-[210] w-full max-w-lg -translate-x-1/2 px-4"
        >
          <button
            type="button"
            onClick={onStop}
            className={cn(
              'w-full rounded-xl border border-border-default bg-bg-elevated/95 p-5',
              'shadow-2xl shadow-black/30 backdrop-blur-xl',
              'transition-colors hover:border-accent-blue/30'
            )}
          >
            {/* Glow orbs — react to audio level */}
            <div className="relative mb-5 flex h-16 items-center justify-center overflow-hidden rounded-lg bg-bg-surface/80">
              <motion.div
                className="absolute h-20 w-20 rounded-full bg-accent-blue/25 blur-2xl"
                animate={{
                  scale: 1 + level * 0.8,
                  opacity: 0.35 + level * 0.45,
                  x: -30 + level * 20,
                }}
                transition={{ duration: 0.12, ease: 'easeOut' }}
              />
              <motion.div
                className="absolute h-16 w-24 rounded-full bg-accent-blue-dim/30 blur-xl"
                animate={{
                  scale: 1 + level * 0.6,
                  opacity: 0.25 + level * 0.4,
                  x: 20 - level * 15,
                }}
                transition={{ duration: 0.1, ease: 'easeOut' }}
              />
              <motion.div
                className="absolute h-12 w-12 rounded-full bg-accent-blue/20 blur-lg"
                animate={{
                  scale: 1 + level * 1.2,
                  opacity: 0.2 + level * 0.5,
                }}
                transition={{ duration: 0.08, ease: 'easeOut' }}
              />

              {/* Waveform bars */}
              <div className="relative flex h-10 items-end justify-center gap-[3px] px-6">
                {Array.from({ length: BAR_COUNT }).map((_, i) => {
                  const center = BAR_COUNT / 2;
                  const dist = Math.abs(i - center) / center;
                  const barLevel = level * (1 - dist * 0.55);
                  const height = 8 + barLevel * 36;

                  return (
                    <motion.div
                      key={i}
                      className="w-[3px] rounded-full bg-accent-blue"
                      animate={{
                        height,
                        opacity: 0.35 + barLevel * 0.65,
                      }}
                      transition={{
                        duration: 0.1,
                        ease: 'easeOut',
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Status */}
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-blue">
                Listening
              </p>
              <p className="mt-1 font-heading text-lg font-semibold text-text-primary">
                {interimText || 'Speak your request…'}
              </p>
              <p className="mt-1 text-[12px] text-text-muted">
                Tap to stop · voice fills the input below
              </p>
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
