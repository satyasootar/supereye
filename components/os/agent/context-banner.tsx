'use client';

import { motion } from 'framer-motion';
import { useAgentContext } from '@/hooks/use-agent-context';
import { Mail, Calendar, Inbox } from 'lucide-react';

export function ContextBanner() {
  const ctx = useAgentContext();

  const Icon =
    ctx.selectedEmail ? Mail : ctx.workspaceMode === 'calendar' ? Calendar : Inbox;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-center gap-2 text-xs font-medium text-text-muted"
    >
      <span className="flex items-center gap-2 rounded-lg border border-border-default bg-bg-elevated/60 px-3 py-1.5 backdrop-blur-md">
        <Icon className="h-3.5 w-3.5 text-accent-blue" />
        <span>Viewing · {ctx.contextLabel}</span>
      </span>
    </motion.div>
  );
}
