'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { ContextBanner } from './agent/context-banner';
import { ConversationStream } from './agent/conversation-stream';
import { FloatingSuggestions } from './agent/floating-suggestions';
import { BottomInput } from './agent/bottom-input';

export function AgentOverlay() {
  const { isAgentOpen, setAgentOpen } = useAppStore();

  useEffect(() => {
    if (!isAgentOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAgentOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isAgentOpen, setAgentOpen]);

  return (
    <AnimatePresence>
      {isAgentOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="AI Assistant"
          className="fixed inset-0 z-[200] pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Light scrim — app stays visible underneath */}
          <div className="absolute inset-0 bg-black/15 backdrop-blur-[10px]" aria-hidden />

          {/* Close button */}
          <button
            type="button"
            onClick={() => setAgentOpen(false)}
            className="absolute right-6 top-6 z-[210] flex h-9 w-9 items-center justify-center rounded-lg border border-border-default bg-bg-elevated/80 text-text-muted backdrop-blur-md transition-colors hover:text-text-primary"
            aria-label="Close assistant"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Content — no giant chat card */}
          <div className="relative z-10 flex h-full flex-col pointer-events-none">
            <div className="flex-1 overflow-y-auto px-6 pt-8 pb-36 pointer-events-auto custom-scrollbar">
              <div className="mx-auto flex max-w-[700px] flex-col gap-4">
                <ContextBanner />
                <FloatingSuggestions />
                <ConversationStream />
              </div>
            </div>
            <BottomInput />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
