'use client';

import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store/app-store';
import { useQuery } from '@tanstack/react-query';
import { Clock, FolderOpen, RefreshCw } from 'lucide-react';
import type { DriveSection } from '@/lib/drive/types';
import type { DriveRecentOverview } from '@/lib/drive/types';
import { DriveItemRow } from './drive-shared';

const NAV: { id: DriveSection; label: string; icon: typeof Clock }[] = [
  { id: 'recent', label: 'Recent', icon: Clock },
  { id: 'browse', label: 'Browse', icon: FolderOpen },
];

export function DriveSidebar({
  variant = 'default',
}: {
  variant?: 'default' | 'right-panel';
}) {
  const {
    driveSection,
    setDriveSection,
    openDriveFolder,
    leftSidebarCollapsed,
  } = useAppStore();

  const isCollapsed = variant === 'default' && leftSidebarCollapsed;

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['drive', 'recent'],
    queryFn: async () => {
      const res = await fetch('/api/drive/recent');
      if (!res.ok) throw new Error('Failed to load Drive');
      return res.json() as Promise<DriveRecentOverview>;
    },
  });

  const quickItems = (data?.recent ?? []).slice(0, 8);

  if (isCollapsed) {
    return (
      <div className="flex h-full w-[48px] flex-col items-center gap-2 py-3">
        {NAV.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            title={label}
            onClick={() => setDriveSection(id)}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
              driveSection === id
                ? 'bg-bg-highlight text-accent-blue'
                : 'text-text-muted hover:bg-bg-overlay'
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
        <button
          type="button"
          title="Refresh"
          onClick={() => refetch()}
          className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-bg-overlay"
        >
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex flex-shrink-0 flex-col gap-0.5 border-b border-border-subtle p-2">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setDriveSection(id)}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[12px] font-medium transition-colors',
              driveSection === id
                ? 'bg-bg-highlight text-text-primary'
                : 'text-text-muted hover:bg-bg-overlay hover:text-text-primary'
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => openDriveFolder('root')}
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[12px] font-medium text-text-muted transition-colors hover:bg-bg-overlay hover:text-text-primary"
        >
          <FolderOpen className="h-4 w-4 flex-shrink-0" />
          My Drive
        </button>
      </div>

      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
          Recent files
        </span>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded p-1 text-text-muted hover:bg-bg-overlay"
          title="Refresh"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <p className="px-3 text-[12px] text-text-muted">Loading…</p>
        ) : quickItems.length === 0 ? (
          <p className="px-3 text-[12px] text-text-muted">No recent files.</p>
        ) : (
          quickItems.map((item) => (
            <DriveItemRow
              key={item.id}
              item={item}
              compact
              onSelect={() =>
                item.isFolder ? openDriveFolder(item.id) : setDriveSection('browse')
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
