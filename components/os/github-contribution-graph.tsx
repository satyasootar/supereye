'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import type { GithubContributionsCalendar } from '@/lib/github/types';

function contributionLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count <= 3) return 1;
  if (count <= 6) return 2;
  if (count <= 9) return 3;
  return 4;
}

const LEVEL_CLASS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'bg-bg-overlay border-border-subtle/60',
  1: 'bg-accent-blue/20 border-accent-blue/30',
  2: 'bg-accent-blue/40 border-accent-blue/45',
  3: 'bg-accent-blue/65 border-accent-blue/60',
  4: 'bg-accent-blue border-accent-blue-dim',
};

function monthLabels(weeks: GithubContributionsCalendar['weeks']) {
  const labels: { label: string; index: number }[] = [];
  let lastMonth = -1;

  weeks.forEach((week, index) => {
    const firstDay = week.days.find((d) => d.date);
    if (!firstDay?.date) return;
    const month = parseISO(firstDay.date).getMonth();
    if (month !== lastMonth) {
      // Always 3-letter month (Jan, Feb, Mar, …)
      labels.push({ label: format(parseISO(firstDay.date), 'MMM'), index });
      lastMonth = month;
    }
  });

  return labels;
}

export function GithubContributionGraph({
  calendar,
  className,
}: {
  calendar: GithubContributionsCalendar;
  className?: string;
}) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const months = useMemo(() => monthLabels(calendar.weeks), [calendar.weeks]);
  const weekCount = calendar.weeks.length;

  return (
    <div className={cn('relative', className)}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="text-[13px] text-text-secondary">
          <span className="font-semibold text-text-primary">
            {calendar.totalContributions.toLocaleString()}
          </span>{' '}
          contributions in the last year
        </p>
      </div>

      <div className="overflow-x-auto custom-scrollbar pb-1">
        <div className="min-w-[680px]">
          <div className="relative mb-1.5 h-4 pl-7">
            {months.map(({ label, index }) => (
              <span
                key={`${label}-${index}`}
                className="absolute top-0 text-[11px] font-medium tracking-wide text-text-secondary"
                style={{
                  left: `calc(1.75rem + ${index} * (100% - 1.75rem) / ${weekCount})`,
                }}
              >
                {label}
              </span>
            ))}
          </div>

          <div className="flex gap-1">
            <div className="flex w-7 flex-col justify-between py-[2px] text-[10px] leading-none text-text-muted">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>

            <div
              className="grid flex-1 gap-[3px]"
              style={{
                gridTemplateColumns: `repeat(${calendar.weeks.length}, minmax(0, 1fr))`,
                gridTemplateRows: 'repeat(7, 11px)',
              }}
            >
              {Array.from({ length: 7 }, (_, dayIndex) =>
                calendar.weeks.map((week, weekIndex) => {
                  const day = week.days[dayIndex];
                  if (!day) {
                    return (
                      <div
                        key={`empty-${weekIndex}-${dayIndex}`}
                        className="h-[11px] w-full rounded-[2px] border border-transparent bg-transparent"
                        style={{ gridColumn: weekIndex + 1, gridRow: dayIndex + 1 }}
                      />
                    );
                  }
                  const level = contributionLevel(day.count);
                  return (
                    <div
                      key={`${weekIndex}-${dayIndex}-${day.date}`}
                      className={cn(
                        'h-[11px] w-full rounded-[2px] border transition-transform hover:scale-110',
                        LEVEL_CLASS[level]
                      )}
                      style={{ gridColumn: weekIndex + 1, gridRow: dayIndex + 1 }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const dateLabel = day.date
                          ? format(parseISO(day.date), 'EEE, MMM d, yyyy')
                          : 'Unknown date';
                        setTooltip({
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                          text: `${day.count} contribution${day.count === 1 ? '' : 's'} on ${dateLabel}`,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      title={
                        day.date
                          ? `${day.count} contributions on ${format(parseISO(day.date), 'MMM d, yyyy')}`
                          : undefined
                      }
                    />
                  );
                })
              ).flat()}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-text-muted">
            <span>Less</span>
            {([0, 1, 2, 3, 4] as const).map((level) => (
              <span
                key={level}
                className={cn('h-[11px] w-[11px] rounded-[2px] border', LEVEL_CLASS[level])}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>

      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-md border border-border-default bg-bg-elevated px-2.5 py-1.5 text-[11px] text-text-primary shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y - 8 }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
