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
      <span className="flex items-center gap-1.5 rounded-full border border-[rgba(115,255,140,0.12)] bg-[rgba(15,15,15,0.35)] px-3 py-1.5 backdrop-blur-md">
        <Icon className="h-3.5 w-3.5 text-[#73FF8C]" />
        <span>Viewing · {ctx.contextLabel}</span>
      </span>
    </motion.div>
  );
}
