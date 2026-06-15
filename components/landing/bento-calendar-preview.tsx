'use client';

import { cn } from '@/lib/utils';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function generateDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const dates: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) dates.push(null);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) dates.push(d);
  return dates;
}

const EVENTS = [
  { title: 'Code', time: '02:15 AM', active: true },
  { title: 'Standup', time: '10:00 AM', active: false },
  { title: 'Design review', time: '2:30 PM', active: false },
];

interface BentoCalendarPreviewProps {
  className?: string;
}

export function BentoCalendarPreview({ className }: BentoCalendarPreviewProps) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthLabel = today.toLocaleString('default', { month: 'long', year: 'numeric' });
  const dates = generateDays(year, month);
  const todayDate = today.getDate();

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="flex flex-1 flex-col rounded-xl border border-border-subtle bg-bg-app mx-3 mt-3 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2">
          <span className="text-[12px] font-semibold text-text-primary">{monthLabel}</span>
          <span className="rounded-full bg-accent-blue/15 px-2 py-0.5 text-[9px] font-semibold text-accent-blue">
            Live
          </span>
        </div>

        {/* Calendar grid */}
        <div className="px-2 py-2">
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {DAYS.map((d) => (
              <div key={d} className="py-0.5 text-[8px] font-mono text-text-muted">
                {d}
              </div>
            ))}
            {dates.map((date, i) => (
              <div
                key={i}
                className={cn(
                  'flex h-6 items-center justify-center text-[10px]',
                  date === null && 'invisible',
                  date === todayDate
                    ? 'rounded-full bg-accent-blue font-bold text-text-inverse'
                    : 'text-text-secondary hover:bg-bg-highlight rounded-full'
                )}
              >
                {date}
              </div>
            ))}
          </div>
        </div>

        {/* Events */}
        <div className="mt-auto border-t border-border-subtle px-2 py-2 space-y-1">
          {EVENTS.map((evt) => (
            <div
              key={evt.title}
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5',
                evt.active ? 'bg-accent-blue/10' : 'hover:bg-bg-highlight/50'
              )}
            >
              <div
                className={cn(
                  'h-1.5 w-1.5 shrink-0 rounded-full',
                  evt.active ? 'bg-accent-blue' : 'bg-text-muted'
                )}
              />
              <span
                className={cn(
                  'flex-1 truncate text-[10px] font-medium',
                  evt.active ? 'text-text-primary' : 'text-text-secondary'
                )}
              >
                {evt.title}
              </span>
              <span className="shrink-0 text-[9px] text-text-muted">{evt.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
