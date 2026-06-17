'use client';

import { motion } from 'framer-motion';
import type { AgentAction } from '@/lib/store/app-store';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

export function GenericToolCard({ action }: { action: AgentAction }) {
  const isRunning = action.status === 'running';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="flex items-center gap-3"
    >
      <div
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-md',
          isRunning ? 'text-accent-blue' : 'text-text-muted'
        )}
      >
        <Sparkles className={cn('h-3.5 w-3.5', isRunning && 'animate-pulse')} />
      </div>
      <div>
        <p className={cn('text-[13px] font-medium text-text-primary', isRunning && 'agent-shimmer-text')}>
          {action.title}
        </p>
        {action.payload?.toolName && (
          <p className="text-[11px] text-text-muted">{action.payload.toolName}</p>
        )}
      </div>
    </motion.div>
  );
}
