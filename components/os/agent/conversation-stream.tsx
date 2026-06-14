'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store/app-store';
import { useAgentContext } from '@/hooks/use-agent-context';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { AgentExecutionTimeline } from './agent-execution-timeline';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function StreamingCursor() {
  return (
    <motion.span
      className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[2px] rounded-sm bg-accent-blue"
      animate={{ opacity: [1, 0.2, 1] }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

function MessageBubble({ msg }: { msg: { id: string; role: string; content: string; isStreaming?: boolean } }) {
  return (
    <motion.div
      key={msg.id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        'max-w-[700px] rounded-xl border px-5 py-4 backdrop-blur-xl',
        msg.role === 'user'
          ? 'ml-auto border-border-default bg-bg-surface/80'
          : 'border-border-default bg-bg-elevated/60'
      )}
    >
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
        {msg.role === 'user' ? 'You' : 'Assistant'}
      </p>

      {msg.role === 'user' ? (
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-text-primary">
          {msg.content}
        </p>
      ) : (
        <div className="text-[15px] leading-relaxed text-text-primary [&>ul]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-3 [&>ol]:list-decimal [&>ol]:pl-5 [&>p]:mb-2.5 [&>p:last-child]:mb-0 [&>strong]:font-semibold [&>strong]:text-text-primary">
          {msg.content ? (
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          ) : msg.isStreaming ? (
            <span className="text-text-muted">Thinking</span>
          ) : null}
          {msg.isStreaming && <StreamingCursor />}
        </div>
      )}
    </motion.div>
  );
}

export function ConversationStream() {
  const { agentMessages, agentSteps, isAgentExecuting } = useAppStore();
  const { userName } = useAgentContext();
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastContent = agentMessages[agentMessages.length - 1]?.content ?? '';

  const streamingIdx = agentMessages.findIndex((m) => m.isStreaming);
  const hasActiveTurn = isAgentExecuting || agentSteps.length > 0;

  // Split: history ends at last user message; streaming assistant rendered after timeline
  let historyMessages = agentMessages;
  let streamingMessage = null;

  if (streamingIdx >= 0) {
    historyMessages = agentMessages.slice(0, streamingIdx);
    streamingMessage = agentMessages[streamingIdx];
  } else if (isAgentExecuting && agentMessages.length > 0) {
    const last = agentMessages[agentMessages.length - 1];
    if (last.role === 'assistant') {
      historyMessages = agentMessages.slice(0, -1);
      streamingMessage = last;
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentMessages.length, lastContent, agentSteps.length]);

  const showGreeting = agentMessages.length === 0;

  return (
    <div className="flex flex-col gap-3">
      {showGreeting && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="max-w-[700px] rounded-xl border border-border-default bg-bg-elevated/60 px-5 py-4 backdrop-blur-xl"
        >
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            Assistant
          </p>
          <p className="text-[15px] leading-relaxed text-text-primary">
            {getGreeting()} {userName}.
            <br />
            How can I help today?
          </p>
        </motion.div>
      )}

      {historyMessages.map((msg) => (
        <MessageBubble key={msg.id} msg={msg} />
      ))}

      {hasActiveTurn && <AgentExecutionTimeline />}

      {streamingMessage && <MessageBubble msg={streamingMessage} />}

      <div ref={bottomRef} />
    </div>
  );
}
