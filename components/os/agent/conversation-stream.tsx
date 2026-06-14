'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store/app-store';
import { useAgentContext } from '@/hooks/use-agent-context';
import { cn } from '@/lib/utils';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function ConversationStream() {
  const { agentMessages } = useAppStore();
  const { userName } = useAgentContext();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentMessages.length]);

  const showGreeting = agentMessages.length === 0;

  return (
    <div className="flex flex-col gap-4">
      {showGreeting && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="max-w-[700px] rounded-3xl border border-[rgba(115,255,140,0.1)] bg-[rgba(15,15,15,0.35)] px-5 py-4 backdrop-blur-[16px]"
        >
          <p className="mb-1 text-[11px] uppercase tracking-wider text-text-muted">
            AI
          </p>
          <p className="text-[15px] leading-relaxed text-text-primary">
            {getGreeting()} {userName}.
            <br />
            How can I help today?
          </p>
        </motion.div>
      )}

      {agentMessages.map((msg) => (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className={cn(
            'max-w-[700px] rounded-3xl border px-5 py-4 backdrop-blur-[16px]',
            'bg-[rgba(15,15,15,0.35)] border-[rgba(115,255,140,0.1)]',
            msg.role === 'user' && 'ml-auto border-white/10 bg-[rgba(20,20,20,0.4)]'
          )}
        >
          <p className="mb-1 text-[11px] uppercase tracking-wider text-text-muted">
            {msg.role === 'user' ? 'You' : 'AI'}
          </p>
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-text-primary">
            {msg.content}
          </p>
        </motion.div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
