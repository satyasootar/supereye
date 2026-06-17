'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { useAgentThreads } from '@/hooks/use-agent-threads';
import { ContextBanner } from './agent/context-banner';
import { ConversationStream } from './agent/conversation-stream';
import { FloatingSuggestions } from './agent/floating-suggestions';
import { BottomInput } from './agent/bottom-input';

const backdropTransition = { duration: 0.15, ease: 'easeOut' as const };

export function AgentOverlay() {
  const { isAgentOpen, setAgentOpen, agentThreadId, isAgentExecuting } = useAppStore();
  const { loadThread } = useAgentThreads();

  useEffect(() => {
    if (!isAgentOpen || !agentThreadId || isAgentExecuting) return;
    if (useAppStore.getState().agentMessages.length > 0) return;

    loadThread(agentThreadId).catch(() => {
      useAppStore.getState().setAgentThreadId(null);
    });
  }, [isAgentOpen, agentThreadId, isAgentExecuting, loadThread]);

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
        <>
          <motion.div
            key="agent-backdrop"
            aria-hidden
            className="fixed inset-0 z-[200] bg-black/15 backdrop-blur-[10px]"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={backdropTransition}
          />

          <motion.div
            key="agent-content"
            role="dialog"
            aria-modal="true"
            aria-label="AI Assistant"
            className="fixed inset-0 z-[201] pointer-events-none"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={backdropTransition}
          >
            <div className="absolute right-6 top-6 z-[210] pointer-events-auto">
              <button
                type="button"
                onClick={() => setAgentOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-default bg-bg-elevated/80 text-text-muted backdrop-blur-md transition-colors hover:text-text-primary"
                aria-label="Close assistant"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative z-10 flex h-full">
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex-1 overflow-y-auto px-6 pt-8 pb-36 pointer-events-auto custom-scrollbar">
                  <div className="mx-auto flex max-w-[700px] flex-col gap-4">
                    <ContextBanner />
                    <ConversationStream />
                    <FloatingSuggestions />
                  </div>
                </div>
                <BottomInput />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
