'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, type AgentStep } from '@/lib/store/app-store';
import { cn } from '@/lib/utils';

const HIDDEN_STEP_PATTERNS = [
  /^connected to assistant/i,
  /^corsair tools ready/i,
  /^loading corsair/i,
  /^reading your context/i,
  /^context loaded/i,
];

function isVisibleStep(step: AgentStep) {
  return !HIDDEN_STEP_PATTERNS.some((p) => p.test(step.label));
}

function shortenLabel(label: string) {
  return label
    .replace(/^executing corsair action$/i, 'Running action')
    .replace(/^discovering available operations$/i, 'Discovering ops')
    .replace(/^reading operation schema$/i, 'Reading schema')
    .replace(/^generating response$/i, 'Writing reply')
    .replace(/^analyzing your request$/i, 'Analyzing')
    .replace(/^analysis complete$/i, 'Analyzed')
    .replace(/^action completed$/i, 'Done')
    .replace(/^response ready$/i, 'Ready')
    .replace(/^synthesizing results$/i, 'Summarizing');
}

export function AgentExecutionTimeline() {
  const { agentSteps, isAgentExecuting } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const visibleSteps = useMemo(
    () => agentSteps.filter(isVisibleStep),
    [agentSteps]
  );

  const runningStep = [...visibleSteps].reverse().find((s) => s.status === 'running');
  const doneSteps = visibleSteps.filter((s) => s.status === 'done');
  const errorStep = visibleSteps.find((s) => s.status === 'error');

  const progress =
    visibleSteps.length > 0
      ? (doneSteps.length / visibleSteps.length) * 100
      : 0;

  // Auto-collapse shortly after work finishes
  useEffect(() => {
    if (!isAgentExecuting && visibleSteps.length > 0) {
      const timer = setTimeout(() => setCollapsed(true), 1200);
      return () => clearTimeout(timer);
    }
    setCollapsed(false);
    setDismissed(false);
  }, [isAgentExecuting, visibleSteps.length]);

  // Fade away entirely after collapse
  useEffect(() => {
    if (collapsed && !isAgentExecuting) {
      const timer = setTimeout(() => setDismissed(true), 2500);
      return () => clearTimeout(timer);
    }
  }, [collapsed, isAgentExecuting]);

  if (visibleSteps.length === 0 || dismissed) return null;

  const currentLabel = errorStep?.label ?? runningStep?.label ?? doneSteps[doneSteps.length - 1]?.label;

  return (
    <AnimatePresence mode="wait">
      {!collapsed ? (
        <motion.div
          key="active"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-[700px]"
        >
          {/* Main activity row — no box, inline feel */}
          <div className="flex items-start gap-3">
            {/* Pulse orb */}
            <div className="relative mt-1 flex h-5 w-5 shrink-0 items-center justify-center">
              {isAgentExecuting && !errorStep ? (
                <>
                  <motion.span
                    className="absolute inset-0 rounded-full bg-accent-blue/20"
                    animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.span
                    className="h-2 w-2 rounded-full bg-accent-blue"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                </>
              ) : errorStep ? (
                <span className="h-2 w-2 rounded-full bg-destructive" />
              ) : (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="h-2 w-2 rounded-full bg-accent-blue"
                />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-2.5">
              {/* Current action */}
              <div className="flex items-baseline gap-2">
                <motion.p
                  key={currentLabel}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'text-[14px] font-medium leading-snug',
                    errorStep ? 'text-destructive' : 'text-text-primary',
                    isAgentExecuting && !errorStep && 'agent-shimmer-text'
                  )}
                >
                  {shortenLabel(currentLabel ?? 'Working')}
                </motion.p>
                {isAgentExecuting && !errorStep && (
                  <motion.span
                    className="font-mono text-[11px] text-text-muted"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  >
                    ···
                  </motion.span>
                )}
              </div>

              {/* Progress track */}
              <div className="relative h-[3px] w-full overflow-hidden rounded-full bg-border-subtle/80">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-accent-blue"
                  initial={{ width: '0%' }}
                  animate={{
                    width: isAgentExecuting
                      ? `${Math.max(progress, 12)}%`
                      : '100%',
                  }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
                {isAgentExecuting && (
                  <motion.div
                    className="absolute inset-y-0 w-16 rounded-full bg-gradient-to-r from-transparent via-white/25 to-transparent"
                    animate={{ x: ['-4rem', '28rem'] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                  />
                )}
              </div>

              {/* Phase pills — horizontal, compact */}
              {visibleSteps.length > 1 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {visibleSteps.map((step, i) => (
                    <PhasePill key={step.id} step={step} index={i} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.button
          key="collapsed"
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setCollapsed(false)}
          className="group flex max-w-[700px] items-center gap-2 py-1 text-left"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent-blue/70" />
          <span className="text-[12px] text-text-muted transition-colors group-hover:text-text-secondary">
            {doneSteps.length} step{doneSteps.length !== 1 ? 's' : ''} completed
          </span>
          <span className="text-[11px] text-text-muted/60 opacity-0 transition-opacity group-hover:opacity-100">
            show
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function PhasePill({ step, index }: { step: AgentStep; index: number }) {
  const isRunning = step.status === 'running';
  const isDone = step.status === 'done';
  const isError = step.status === 'error';

  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors',
        isRunning && 'bg-accent-blue/12 text-accent-blue ring-1 ring-accent-blue/20',
        isDone && 'bg-bg-surface/60 text-text-muted',
        isError && 'bg-destructive/10 text-destructive',
        !isRunning && !isDone && !isError && 'bg-bg-surface/40 text-text-muted'
      )}
    >
      <span
        className={cn(
          'h-1 w-1 rounded-full',
          isRunning && 'bg-accent-blue animate-pulse',
          isDone && 'bg-accent-blue/60',
          isError && 'bg-destructive',
          !isRunning && !isDone && !isError && 'bg-border-strong'
        )}
      />
      {shortenLabel(step.label)}
    </motion.span>
  );
}
