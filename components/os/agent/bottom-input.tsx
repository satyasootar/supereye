'use client';

import { useState, FormEvent, KeyboardEvent, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, ArrowUp, Loader2, Wand2 } from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { useAgentChat } from '@/hooks/use-agent-chat';
import { useVoiceInput } from '@/hooks/use-voice-input';
import { InlineVoiceBar } from './inline-voice-bar';
import { ThreadHistoryPopover } from './thread-history-popover';
import { AGENT_SAMPLE_GROUPS, fillAgentInput } from '@/lib/agent/sample-prompts';
import { cn } from '@/lib/utils';

export function BottomInput() {
  const [input, setInput] = useState('');
  const { isAgentExecuting, agentInteractiveMode, setAgentInteractiveMode, agentMessages } =
    useAppStore();
  const { sendMessage } = useAgentChat();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTranscript = useCallback((prefix: string, spoken: string) => {
    setInput(prefix ? `${prefix} ${spoken}`.trim() : spoken);
  }, []);

  const {
    isListening,
    isSupported,
    isProcessing,
    audioLevel,
    elapsedSec,
    error,
    mode,
    start,
    cancel,
    confirm,
  } = useVoiceInput(handleTranscript);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [input, isListening]);

  useEffect(() => {
    const onFocusInput = () => textareaRef.current?.focus();
    const onFillInput = (e: Event) => {
      const text = (e as CustomEvent<{ text: string }>).detail?.text;
      if (typeof text === 'string') setInput(text);
    };
    window.addEventListener('agent:focus-input', onFocusInput);
    window.addEventListener('agent:fill-input', onFillInput);
    return () => {
      window.removeEventListener('agent:focus-input', onFocusInput);
      window.removeEventListener('agent:fill-input', onFillInput);
    };
  }, []);

  const handleVoiceStart = () => {
    if (!isListening && !isProcessing) start(input);
  };

  const handleVoiceConfirm = () => {
    confirm();
    textareaRef.current?.focus();
  };

  const handleVoiceCancel = () => {
    cancel();
    textareaRef.current?.focus();
  };

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isAgentExecuting || isProcessing) return;
    if (isListening) confirm();
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

  const showVoiceBar = isListening || isProcessing;
  const showInputSamples = !input.trim() && agentMessages.length === 0 && !showVoiceBar;
  const quickSamples = AGENT_SAMPLE_GROUPS.map((g) => g.samples[0]);
  const placeholder = isProcessing
    ? 'Processing your voice…'
    : isListening
      ? mode === 'whisper'
        ? 'Recording… tap ✓ to transcribe into the box'
        : 'Speak now — words appear here as you talk…'
      : 'Ask your assistant...';

  return (
    <motion.div
      className="pointer-events-auto fixed bottom-6 left-1/2 z-[210] w-full max-w-2xl -translate-x-1/2 px-4"
      initial={{ opacity: 0, scale: 0.98, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
    >
      <form
        onSubmit={handleSubmit}
        className={cn(
          'overflow-hidden rounded-xl border border-border-default',
          'bg-bg-elevated/90 shadow-xl shadow-black/25 backdrop-blur-xl',
          showVoiceBar && 'border-accent-blue/35 ring-1 ring-accent-blue/15'
        )}
      >
        {showInputSamples && (
          <div className="flex flex-wrap gap-1.5 border-b border-border-subtle/60 px-3 py-2">
            {quickSamples.map((sample) => (
              <button
                key={sample.id}
                type="button"
                disabled={isAgentExecuting}
                onClick={() => fillAgentInput(sample.prompt)}
                className={cn(
                  'rounded-md border border-border-subtle bg-bg-surface px-2.5 py-1 text-[11px] font-medium text-text-secondary transition-colors',
                  'hover:border-accent-blue/30 hover:text-text-primary disabled:opacity-40'
                )}
              >
                {sample.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 p-2">
          <div className="flex shrink-0 items-center pb-1 pl-1">
            {!showVoiceBar && <ThreadHistoryPopover />}
          </div>

          <div className="min-w-0 flex-1">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isAgentExecuting || isProcessing}
              autoFocus
              className={cn(
                'max-h-32 min-h-[44px] w-full resize-none bg-transparent px-3 py-2.5',
                'text-[14px] leading-relaxed text-text-primary outline-none',
                'placeholder:text-text-muted disabled:opacity-60',
                showVoiceBar && 'caret-accent-blue'
              )}
            />
            {error && (
              <p className="px-3 pb-1 text-[11px] text-destructive">{error}</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1 pb-1 pr-1">
            <button
              type="button"
              onClick={() => setAgentInteractiveMode(!agentInteractiveMode)}
              disabled={isAgentExecuting}
              title="Guided mode: review and edit emails before sending"
              className={cn(
                'flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold transition-all',
                agentInteractiveMode
                  ? 'border-accent-blue/40 bg-accent-blue/10 text-accent-blue'
                  : 'border-border-subtle bg-bg-surface text-text-muted hover:border-border-default hover:text-text-primary',
                'disabled:opacity-40'
              )}
              aria-pressed={agentInteractiveMode}
              aria-label="Toggle guided mode"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Guided
            </button>

            {isSupported && !showVoiceBar && (
              <button
                type="button"
                onClick={handleVoiceStart}
                disabled={isAgentExecuting}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg border transition-all',
                  'border-border-subtle bg-bg-surface text-text-muted',
                  'hover:border-border-default hover:text-text-primary',
                  'disabled:opacity-40'
                )}
                aria-label="Voice input"
              >
                <Mic className="h-4 w-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={isAgentExecuting || isProcessing || !input.trim()}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg transition-all',
                'bg-accent-blue text-text-inverse hover:bg-accent-blue-dim',
                'disabled:opacity-30 disabled:hover:bg-accent-blue'
              )}
              aria-label="Send message"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>

        {showVoiceBar && (
          <InlineVoiceBar
            audioLevel={audioLevel}
            elapsedSec={elapsedSec}
            processing={isProcessing}
            onCancel={handleVoiceCancel}
            onConfirm={handleVoiceConfirm}
          />
        )}
      </form>
    </motion.div>
  );
}
