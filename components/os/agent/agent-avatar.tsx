'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function AgentAvatar({
  size = 32,
  working = false,
  className,
}: {
  size?: number;
  working?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn('relative shrink-0', className)}
      style={{ width: size, height: size }}
    >
      {working && (
        <motion.span
          className="absolute inset-0 rounded-full bg-accent-blue/15"
          animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        className="text-text-primary"
        stroke="currentColor"
        strokeWidth="3"
        style={{ width: size, height: size }}
      >
        <circle cx="50" cy="50" r="46" className="fill-bg-elevated stroke-border-default" />
        <rect x="35" y="38" width="8" height="24" rx="6" className="fill-current stroke-none" />
        <rect x="57" y="38" width="8" height="24" rx="6" className="fill-current stroke-none" />
      </svg>
    </div>
  );
}
