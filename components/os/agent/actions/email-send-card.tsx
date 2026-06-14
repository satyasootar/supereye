'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { AgentAction } from '@/lib/store/app-store';
import { cn } from '@/lib/utils';
import { Check, Loader2, Wifi } from 'lucide-react';

const PHASES = [
  { key: 'connecting', label: 'Connecting to Gmail', icon: Wifi },
  { key: 'sending', label: 'Sending message', icon: Loader2 },
  { key: 'sent', label: 'Email sent successfully', icon: Check },
] as const;

export function EmailSendCard({
  action,
  canReveal,
}: {
  action: AgentAction;
  canReveal: boolean;
}) {
  const phase = action.payload?.phase ?? 'connecting';
  const isError = action.status === 'error';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (canReveal) {
      const t = setTimeout(() => setVisible(true), 200);
      return () => clearTimeout(t);
    }
    setVisible(false);
  }, [canReveal]);

  if (!visible && !isError) return null;

  const activeIndex = PHASES.findIndex((p) => p.key === phase);
  const currentIndex = activeIndex >= 0 ? activeIndex : action.status === 'done' ? 2 : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      {PHASES.map((step, i) => {
        const isActive = i === currentIndex && action.status === 'running';
        const isDone = i < currentIndex || (action.status === 'done' && i <= currentIndex);
        const isFuture = i > currentIndex && action.status === 'running';
        if (isFuture) return null;

        const Icon = step.icon;
        return (
          <motion.div
            key={step.key}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className={cn(
              'flex items-center gap-3 rounded-lg border px-3 py-2.5',
              isDone && !isError
                ? 'border-accent-blue/25 bg-accent-blue/8'
                : isError && i === currentIndex
                  ? 'border-destructive/30 bg-destructive/8'
                  : 'border-border-default bg-bg-elevated/60'
            )}
          >
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md',
                isDone && !isError ? 'bg-accent-blue/20 text-accent-blue' : 'bg-bg-surface text-text-muted'
              )}
            >
              {isActive ? (
                <Icon className="h-3.5 w-3.5 animate-spin" />
              ) : isDone && !isError ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Icon className="h-3.5 w-3.5" />
              )}
            </div>
            <span
              className={cn(
                'text-[13px] font-medium',
                isError && i === currentIndex ? 'text-destructive' : 'text-text-primary'
              )}
            >
              {isError && i === currentIndex ? action.title : step.label}
            </span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
