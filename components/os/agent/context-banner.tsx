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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="flex items-center gap-2 text-[11px] font-medium text-text-muted"
    >
      <Icon className="h-3.5 w-3.5 text-accent-blue" />
      <span>Viewing · {ctx.contextLabel}</span>
    </motion.div>
  );
}
