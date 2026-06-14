'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, Circle, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils';

export function AgentExecutionTimeline() {
  const { agentSteps, isAgentExecuting } = useAppStore();

  if (agentSteps.length === 0) return null;

  const doneCount = agentSteps.filter((s) => s.status === 'done').length;
  const progress = agentSteps.length > 0 ? (doneCount / agentSteps.length) * 100 : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className="max-w-[700px] overflow-hidden rounded-xl border border-border-default bg-bg-elevated/70 backdrop-blur-xl"
      >
        {/* Progress bar */}
        <div className="h-[2px] w-full bg-border-subtle">
          <motion.div
            className="h-full bg-accent-blue"
            initial={{ width: 0 }}
            animate={{ width: `${isAgentExecuting ? Math.max(progress, 8) : 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>

        <div className="px-4 py-3.5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
              {isAgentExecuting ? 'Agent Activity' : 'Completed'}
            </p>
            {isAgentExecuting && (
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-[11px] text-accent-blue"
              >
                Live
              </motion.span>
            )}
          </div>

          <ul className="flex flex-col gap-1">
            {agentSteps.map((step, i) => (
              <motion.li
                key={step.id}
                layout
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-2 py-1.5 text-[13px]',
                  step.status === 'running' && 'bg-bg-highlight/60',
                  step.status === 'done' && 'text-text-secondary',
                  step.status === 'error' && 'bg-destructive/5 text-destructive'
                )}
              >
                <StepIcon status={step.status} />
                <span
                  className={cn(
                    'flex-1',
                    step.status === 'running' && 'font-medium text-text-primary',
                    step.status === 'done' && 'text-text-secondary',
                    step.status === 'error' && 'text-destructive'
                  )}
                >
                  {step.label}
                </span>
                {step.status === 'running' && (
                  <motion.span
                    className="h-1.5 w-1.5 rounded-full bg-accent-blue"
                    animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function StepIcon({ status }: { status: string }) {
  if (status === 'done') {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
      >
        <Check className="h-3.5 w-3.5 shrink-0 text-accent-blue" strokeWidth={2.5} />
      </motion.div>
    );
  }
  if (status === 'running') {
    return <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-accent-blue" />;
  }
  if (status === 'error') {
    return <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />;
  }
  return <Circle className="h-3.5 w-3.5 shrink-0 text-text-muted" />;
}
