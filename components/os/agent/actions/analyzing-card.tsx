'use client';

import { motion } from 'framer-motion';
import type { AgentAction } from '@/lib/store/app-store';
import { cn } from '@/lib/utils';

export function AnalyzingCard({ action }: { action: AgentAction }) {
  const isRunning = action.status === 'running';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
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
