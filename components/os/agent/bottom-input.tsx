'use client';

import { useState, FormEvent, KeyboardEvent, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mic, ArrowUp, Square } from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { useAgentChat } from '@/hooks/use-agent-chat';
import { useVoiceInput } from '@/hooks/use-voice-input';
import { VoiceVisualizer } from './voice-visualizer';
import { cn } from '@/lib/utils';

export function BottomInput() {
  const [input, setInput] = useState('');
  const { isAgentExecuting } = useAppStore();
  const { sendMessage } = useAgentChat();

  const handleTranscript = useCallback((prefix: string, spoken: string) => {
    // Replace voice text each event — never append duplicates
    setInput(prefix ? `${prefix} ${spoken}`.trim() : spoken);
  }, []);

  const { isListening, isSupported, audioLevel, interimText, start, stop } =
    useVoiceInput(handleTranscript);

  const handleVoiceToggle = () => {
    if (isListening) {
      stop();
    } else {
      start(input);
    }
  };

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isAgentExecuting) return;
    if (isListening) stop();
    const text = input;
    setInput('');
    await sendMessage(text);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      <VoiceVisualizer
        isListening={isListening}
        audioLevel={audioLevel}
        interimText={interimText}
        onStop={stop}
      />

      <motion.div
        className="pointer-events-auto fixed bottom-6 left-1/2 z-[210] w-full max-w-2xl -translate-x-1/2 px-4"
        initial={{ opacity: 0, scale: 0.98, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      >
        <form
          onSubmit={handleSubmit}
          className={cn(
            'flex items-end gap-2 rounded-xl border border-border-default',
            'bg-bg-elevated/90 p-2 shadow-xl shadow-black/25 backdrop-blur-xl',
            isListening && 'border-accent-blue/40 ring-1 ring-accent-blue/20'
          )}
        >
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? 'Listening…' : 'Ask your assistant...'}
            disabled={isAgentExecuting}
            autoFocus
            className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-[14px] leading-relaxed text-text-primary outline-none placeholder:text-text-muted disabled:opacity-60"
          />

          <div className="flex shrink-0 items-center gap-1.5 pb-1 pr-1">
            {isSupported && (
              <button
                type="button"
                onClick={handleVoiceToggle}
                disabled={isAgentExecuting}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg border transition-all',
                  isListening
                    ? 'border-accent-blue/50 bg-accent-blue/15 text-accent-blue'
                    : 'border-border-subtle bg-bg-surface text-text-muted hover:border-border-default hover:text-text-primary',
                  'disabled:opacity-40'
                )}
                aria-label={isListening ? 'Stop listening' : 'Voice input'}
              >
                {isListening ? (
                  <Square className="h-3.5 w-3.5 fill-current" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </button>
            )}

            <button
              type="submit"
              disabled={isAgentExecuting || !input.trim()}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg transition-all',
                'bg-accent-blue text-text-inverse hover:bg-accent-blue-dim',
                'disabled:opacity-30 disabled:hover:bg-accent-blue'
              )}
              aria-label="Send message"
            >
              <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}
