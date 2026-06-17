'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store/app-store';
import { useAgentContext } from '@/hooks/use-agent-context';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { ActionStream } from './action-stream';
import { EmailReviewPanel } from './email-review-panel';
import { AgentAvatar } from './agent-avatar';

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

const springEntrance = {
  type: 'spring' as const,
  stiffness: 220,
  damping: 28,
};

function MessageRow({
  msg,
}: {
  msg: { id: string; role: string; content: string; isStreaming?: boolean };
}) {
  const isUser = msg.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springEntrance}
      className={cn('flex gap-3', isUser && 'flex-row-reverse')}
    >
      {!isUser && <AgentAvatar size={28} working={!!msg.isStreaming} className="mt-0.5 shrink-0" />}

      {isUser ? (
        <div className="max-w-[min(640px,85%)] rounded-lg bg-bg-surface/50 px-4 py-3">
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-text-primary">
            {msg.content}
          </p>
        </div>
      ) : (
        <div className="max-w-[min(640px,85%)] pb-4 border-b border-border-subtle/40">
          <div className="text-[15px] leading-relaxed text-text-primary [&>ul]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-3 [&>ol]:list-decimal [&>ol]:pl-5 [&>p]:mb-2.5 [&>p:last-child]:mb-0 [&>strong]:font-semibold [&>strong]:text-text-primary">
            {msg.content ? (
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            ) : msg.isStreaming ? (
              <span className="agent-shimmer-text text-[14px]">Composing response</span>
            ) : null}
            {msg.isStreaming && <StreamingCursor />}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function ConversationStream() {
  const { agentMessages, agentActions, isAgentExecuting, agentPendingReview } = useAppStore();
  const { userName } = useAgentContext();
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastContent = agentMessages[agentMessages.length - 1]?.content ?? '';

  const streamingIdx = agentMessages.findIndex((m) => m.isStreaming);
  const showActions = agentActions.length > 0 || isAgentExecuting;

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
  }, [agentMessages.length, lastContent, agentActions.length]);

  const showGreeting = agentMessages.length === 0 && !isAgentExecuting;

  return (
    <div className="flex flex-col gap-5">
      {showGreeting && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springEntrance}
          className="flex gap-3"
        >
          <AgentAvatar size={28} className="mt-0.5 shrink-0" />
          <div className="pb-4 border-b border-border-subtle/40">
            <p className="text-[15px] leading-relaxed text-text-primary">
              {getGreeting()} {userName}.
              <br />
              How can I help today?
            </p>
          </div>
        </motion.div>
      )}

      {historyMessages.map((msg) => (
        <MessageRow key={msg.id} msg={msg} />
      ))}

      {showActions && <ActionStream />}

      {agentPendingReview && <EmailReviewPanel />}

      {streamingMessage && <MessageRow msg={streamingMessage} />}

      <div ref={bottomRef} />
    </div>
  );
}
