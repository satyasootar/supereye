'use client';

import { useState, FormEvent, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { Mic, Sparkles } from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { useAgentChat } from '@/hooks/use-agent-chat';
import { cn } from '@/lib/utils';

export function BottomInput() {
  const [input, setInput] = useState('');
  const { isAgentExecuting } = useAppStore();
  const { sendMessage } = useAgentChat();

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isAgentExecuting) return;
    const text = input;
    setInput('');
    await sendMessage(text);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <motion.div
      className="pointer-events-auto fixed bottom-8 left-1/2 z-[210] w-full max-w-xl -translate-x-1/2 px-4"
      initial={{ opacity: 0, scale: 0.98, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
    >
      <form
        onSubmit={handleSubmit}
        className={cn(
          'flex items-center gap-3 rounded-full px-5 py-3.5',
          'border border-[rgba(115,255,140,0.15)] bg-[rgba(10,10,10,0.45)]',
          'shadow-lg shadow-black/20 backdrop-blur-[24px]'
        )}
      >
        <Sparkles className="h-4 w-4 shrink-0 text-[#73FF8C]" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask your assistant..."
          disabled={isAgentExecuting}
          autoFocus
          className="flex-1 bg-transparent text-[15px] text-text-primary outline-none placeholder:text-text-muted disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isAgentExecuting || !input.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(115,255,140,0.15)] text-[#73FF8C] transition-colors hover:bg-[rgba(115,255,140,0.25)] disabled:opacity-40"
          aria-label="Send message"
        >
          <Mic className="h-4 w-4" />
        </button>
      </form>
    </motion.div>
  );
}
