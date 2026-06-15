'use client';

import { cn } from '@/lib/utils';

export function DataTable({
  columns,
  rows,
  emptyMessage = 'No records found.',
}: {
  columns: { key: string; label: string; className?: string }[];
  rows: Record<string, React.ReactNode>[];
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border-subtle px-4 py-8 text-center text-sm text-text-muted">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border-subtle">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-border-subtle bg-bg-surface">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-3 py-2.5 text-[11px] font-medium uppercase tracking-wide text-text-muted',
                  col.className
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-border-subtle/60 last:border-0 hover:bg-bg-surface/50"
            >
              {columns.map((col) => (
                <td key={col.key} className={cn('px-3 py-2.5 text-text-secondary', col.className)}>
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
