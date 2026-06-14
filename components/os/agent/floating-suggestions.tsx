'use client';

import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store/app-store';
import { useAgentChat } from '@/hooks/use-agent-chat';

const SUGGESTIONS = [
  'Summarize unread emails',
  'Draft replies',
  'Find unanswered conversations',
  "Today's agenda",
  'Schedule meeting',
  'Create tasks from emails',
];

export function FloatingSuggestions() {
  const { agentMessages, isAgentExecuting } = useAppStore();
  const { sendMessage } = useAgentChat();

  if (agentMessages.length > 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.1 }}
      className="flex flex-wrap gap-2"
    >
      {SUGGESTIONS.map((label, i) => (
        <motion.button
          key={label}
          type="button"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 * i }}
          disabled={isAgentExecuting}
          onClick={() => sendMessage(label)}
          className="rounded-lg border border-border-default bg-bg-elevated/70 px-3.5 py-2 text-[13px] text-text-secondary backdrop-blur-md transition-colors hover:border-accent-blue/30 hover:bg-bg-highlight/50 hover:text-text-primary disabled:opacity-50"
        >
          {label}
        </motion.button>
      ))}
    </motion.div>
  );
}
