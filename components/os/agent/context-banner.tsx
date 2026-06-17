'use client';

import { motion } from 'framer-motion';
import { useAgentContext } from '@/hooks/use-agent-context';
import { AgentServiceIcon, resolveContextService } from './agent-service-icon';

export function ContextBanner() {
  const ctx = useAgentContext();

  const service = resolveContextService(ctx.workspaceMode);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="flex items-center gap-2 text-[11px] font-medium text-text-muted"
    >
      <AgentServiceIcon service={service} size={14} />
      <span>Viewing · {ctx.contextLabel}</span>
    </motion.div>
  );
}
