'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Calendar, Flame, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastItem = {
  id: string;
  title: string;
  description: string;
  icon: typeof Flame;
  iconClass: string;
  bgClass: string;
};

const TOASTS: ToastItem[] = [
  {
    id: 'urgent',
    title: 'Urgent email flagged',
    description: 'GitHub security advisory needs your attention',
    icon: Flame,
    iconClass: 'text-[color:var(--priority-urgent)]',
    bgClass: 'bg-[color:var(--priority-urgent)]/10',
  },
  {
    id: 'meeting',
    title: 'Meeting in 15 minutes',
    description: 'Code — Google Meet link is ready',
    icon: Calendar,
    iconClass: 'text-accent-blue',
    bgClass: 'bg-accent-blue/10',
  },
  {
    id: 'email',
    title: 'New email from Sahil Kumar',
    description: 'I want to connect — Sales Coordinator',
    icon: Mail,
    iconClass: 'text-text-secondary',
    bgClass: 'bg-bg-highlight',
  },
  {
    id: 'triage',
    title: 'AI triage complete',
    description: '10 urgent · 82 can wait — inbox sorted',
    icon: Bell,
    iconClass: 'text-[color:var(--priority-ai)]',
    bgClass: 'bg-[color:var(--priority-ai)]/10',
  },
];

function SonnerToast({ toast }: { toast: ToastItem }) {
  const Icon = toast.icon;
  return (
    <div className="flex w-full items-start gap-3 rounded-xl border border-border-subtle bg-bg-elevated p-3 shadow-lg">
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          toast.bgClass
        )}
      >
        <Icon className={cn('h-4 w-4', toast.iconClass)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold text-text-primary">{toast.title}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-text-secondary">
          {toast.description}
        </p>
      </div>
    </div>
  );
}

export function BentoSonnerDemo() {
  const [stack, setStack] = useState<(ToastItem & { instanceId: number })[]>([
    { ...TOASTS[0], instanceId: 0 }
  ]);

  useEffect(() => {
    let cursor = 1;
    const interval = window.setInterval(() => {
      const next = TOASTS[cursor % TOASTS.length];
      const instanceId = cursor;
      cursor += 1;
      setStack((prev) => [
        { ...next, instanceId },
        ...prev
      ].slice(0, 3));
    }, 3200);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden p-3 pt-4">
      <AnimatePresence initial={false}>
        {stack.map((toast, i) => (
          <motion.div
            key={toast.instanceId}
            layout
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{
              opacity: Math.max(0.35, 1 - i * 0.22),
              y: 0,
              scale: 1 - i * 0.03,
            }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="w-full"
            style={{ zIndex: 10 - i }}
          >
            <SonnerToast toast={toast} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
