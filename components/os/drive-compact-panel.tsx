'use client';

import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store/app-store';
import { useQuery } from '@tanstack/react-query';
import { FolderOpen, RefreshCw } from 'lucide-react';
import type { DriveRecentOverview } from '@/lib/drive/types';
import { DriveItemRow } from './drive-shared';

export function DriveCompactPanel({ hideHeader = false }: { hideHeader?: boolean }) {
  const { openDriveFolder, setDriveSection } = useAppStore();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['drive', 'recent'],
    queryFn: async () => {
      const res = await fetch('/api/drive/recent');
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? 'Failed to load Drive');
      }
      return res.json() as Promise<DriveRecentOverview>;
    },
  });

  const items = (data?.recent ?? []).slice(0, 10);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-bg-surface">
      {!hideHeader && (
        <div className="flex h-10 flex-shrink-0 items-center justify-between border-b border-border-subtle px-3">
          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-text-primary">
            <FolderOpen className="h-3.5 w-3.5" />
            Drive
          </span>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded p-1 text-text-muted hover:bg-bg-overlay hover:text-text-primary"
            title="Refresh"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
          </button>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-[12px] text-text-muted">
            Loading…
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-32 items-center justify-center px-4 text-center text-[12px] text-text-muted">
            No recent files in Drive.
          </div>
        ) : (
          items.map((item) => (
            <DriveItemRow
              key={item.id}
              item={item}
              compact
              onSelect={() => {
                if (item.isFolder) {
                  openDriveFolder(item.id);
                }
                setDriveSection('browse');
              }}
            />
          ))
        )}
      </div>

      {items.length > 0 && (
        <div className="flex-shrink-0 border-t border-border-subtle p-2">
          <button
            type="button"
            onClick={() => setDriveSection('browse')}
            className="w-full rounded-md py-1.5 text-center text-[11px] font-medium text-accent-blue hover:bg-bg-highlight"
          >
            Open Drive browser
          </button>
        </div>
      )}
    </div>
  );
}
