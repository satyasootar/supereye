'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, Circle } from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils';

export function AgentExecutionTimeline() {
  const { agentSteps, isAgentExecuting } = useAppStore();

  if (!isAgentExecuting && agentSteps.length === 0) return null;

  return (
    <AnimatePresence>
      {(isAgentExecuting || agentSteps.some((s) => s.status === 'done')) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="max-w-[700px] rounded-3xl border border-[rgba(115,255,140,0.08)] bg-[rgba(15,15,15,0.25)] px-5 py-4 backdrop-blur-[16px]"
        >
          <p className="mb-3 text-[11px] uppercase tracking-wider text-text-muted">
            {isAgentExecuting ? 'Working...' : 'Completed'}
          </p>
          <ul className="flex flex-col gap-2">
            {agentSteps.map((step) => (
              <motion.li
                key={step.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2.5 text-sm text-text-secondary"
              >
                <StepIcon status={step.status} />
                <span
                  className={cn(
                    step.status === 'done' && 'text-text-primary',
                    step.status === 'running' && 'text-[#73FF8C]',
                    step.status === 'error' && 'text-destructive'
                  )}
                >
                  {step.label}
                </span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StepIcon({ status }: { status: string }) {
  if (status === 'done') {
    return <Check className="h-4 w-4 shrink-0 text-[#73FF8C]" />;
  }
  if (status === 'running') {
    return <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#73FF8C]" />;
  }
  if (status === 'error') {
    return <Circle className="h-4 w-4 shrink-0 text-destructive" />;
  }
  return <Circle className="h-4 w-4 shrink-0 text-text-muted" />;
}
