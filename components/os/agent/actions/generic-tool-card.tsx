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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-xl border border-border-default bg-bg-elevated/50 px-4 py-3"
    >
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg bg-bg-surface',
          isRunning && 'text-accent-blue'
        )}
      >
        <Sparkles className={cn('h-4 w-4', isRunning && 'animate-pulse')} />
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
