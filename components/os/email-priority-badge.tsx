'use client';

import { cn } from '@/lib/utils';
import { AlertCircle, Clock3 } from 'lucide-react';
import type { EmailPriorityTier } from '@/lib/mail/priority';
import { PRIORITY_TIER_LABELS } from '@/lib/mail/priority';

type EmailPriorityBadgeProps = {
  tier: EmailPriorityTier;
  reason?: string | null;
  compact?: boolean;
  className?: string;
};

export function EmailPriorityBadge({
  tier,
  reason,
  compact = false,
  className,
}: EmailPriorityBadgeProps) {
  const isUrgent = tier === 'urgent';
  const Icon = isUrgent ? AlertCircle : Clock3;
  const label = PRIORITY_TIER_LABELS[tier];

  return (
    <span
      title={reason || label}
      className={cn(
        'inline-flex items-center gap-1 font-semibold leading-none',
        compact
          ? 'text-[10px]'
          : 'rounded-full border px-2 py-0.5 text-[11px]',
        isUrgent
          ? compact
            ? 'text-[color:var(--priority-urgent)]'
            : 'border-[color:var(--priority-urgent)]/30 bg-[color:var(--priority-urgent)]/10 text-[color:var(--priority-urgent)]'
          : compact
            ? 'text-[color:var(--priority-low)]'
            : 'border-[color:var(--priority-low)]/30 bg-[color:var(--priority-low)]/10 text-[color:var(--priority-low)]',
        className
      )}
    >
      <Icon className={cn(compact ? 'h-3.5 w-3.5' : 'h-3 w-3')} />
      {!compact && label}
    </span>
  );
}
