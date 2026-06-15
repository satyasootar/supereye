import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = 'muted',
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  accent?: 'blue' | 'green' | 'urgent' | 'muted';
}) {
  return (
    <div className="rounded-xl border border-border-default bg-bg-elevated p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold leading-none text-text-primary">{value}</p>
          {hint && <p className="mt-1.5 text-[12px] text-text-muted">{hint}</p>}
        </div>
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
            accent === 'urgent'
              ? 'border-[color:var(--priority-urgent)]/25 bg-[color:var(--priority-urgent)]/10 text-[color:var(--priority-urgent)]'
              : accent === 'blue'
                ? 'border-accent-blue/25 bg-accent-blue/10 text-accent-blue'
                : accent === 'green'
                  ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-500'
                  : 'border-border-subtle bg-bg-surface text-text-muted'
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
