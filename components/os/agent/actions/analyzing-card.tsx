'use client';

import { motion } from 'framer-motion';
import type { AgentAction } from '@/lib/store/app-store';
import { cn } from '@/lib/utils';

export function AnalyzingCard({ action }: { action: AgentAction }) {
  const isRunning = action.status === 'running';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border-default/80 bg-bg-elevated/50 px-4 py-3 backdrop-blur-md"
    >
      <p
        className={cn(
          'text-[13px] font-medium text-text-primary',
          isRunning && 'agent-shimmer-text'
        )}
      >
        {action.title}
        {isRunning && (
          <motion.span
            className="ml-1 text-text-muted"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            ···
          </motion.span>
        )}
      </p>
    </motion.div>
  );
}
