'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const NOTIFICATIONS = [
  {
    name: 'Urgent: GitHub security advisory',
    description: 'Repository supereye needs update',
    time: '2m',
    icon: '⚡',
    color: 'var(--priority-urgent)',
  },
  {
    name: 'Meeting in 15 minutes',
    description: 'Code — Google Meet ready',
    time: '13m',
    icon: '📅',
    color: 'var(--accent-blue)',
  },
  {
    name: 'New email from Sahil Kumar',
    description: 'I want to connect',
    time: '28m',
    icon: '✉️',
    color: 'var(--text-muted)',
  },
  {
    name: 'AI triage complete',
    description: '10 urgent · 82 can wait',
    time: '1h',
    icon: '✨',
    color: 'var(--priority-ai)',
  },
  {
    name: 'Calendar synced',
    description: '3 events from Gmail invites',
    time: '2h',
    icon: '🔄',
    color: 'var(--success)',
  },
];

interface BentoNotificationListProps {
  className?: string;
}

export function BentoNotificationList({ className }: BentoNotificationListProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % NOTIFICATIONS.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const items = [
    NOTIFICATIONS[index],
    NOTIFICATIONS[(index + 1) % NOTIFICATIONS.length],
  ];

  return (
    <div
      className={cn(
        'absolute inset-x-4 top-3 flex flex-col gap-2',
        className
      )}
    >
      <AnimatePresence mode="popLayout">
        {items.map((item, i) => (
          <motion.div
            key={`${item.name}-${index}-${i}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-2.5 rounded-lg border border-border-subtle bg-bg-app/90 px-2.5 py-2 shadow-sm backdrop-blur-sm"
          >
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs"
              style={{ background: `color-mix(in srgb, ${item.color} 15%, transparent)` }}
            >
              {item.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium text-text-primary">
                {item.name}
              </p>
              <p className="truncate text-[10px] text-text-muted">{item.description}</p>
            </div>
            <span className="shrink-0 font-mono text-[9px] text-text-muted">{item.time}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
