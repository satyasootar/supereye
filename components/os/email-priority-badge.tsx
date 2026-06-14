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
        'inline-flex items-center gap-1 rounded-full border font-semibold leading-none',
        compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]',
        isUrgent
          ? 'border-[color:var(--priority-urgent)]/30 bg-[color:var(--priority-urgent)]/10 text-[color:var(--priority-urgent)]'
          : 'border-[color:var(--priority-low)]/30 bg-[color:var(--priority-low)]/10 text-[color:var(--priority-low)]',
        className
      )}
    >
      <Icon className={cn(compact ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
      {!compact && label}
    </span>
  );
}
