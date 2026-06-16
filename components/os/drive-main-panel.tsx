'use client';

import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store/app-store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Clock, FolderOpen, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import type { DriveSection } from '@/lib/drive/types';
import { DriveRecentPanel } from './drive-recent-panel';
import { DriveBrowsePanel } from './drive-browse-panel';

const SECTIONS: { id: DriveSection; label: string; icon: typeof Clock }[] = [
  { id: 'recent', label: 'Recent', icon: Clock },
  { id: 'browse', label: 'Browse', icon: FolderOpen },
];

export function DriveMainPanel() {
  const { driveSection, setDriveSection } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/drive/sync', { method: 'POST' });
      if (!res.ok) throw new Error('Sync failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drive'] });
      toast.success('Drive synced');
    },
    onError: () => toast.error('Drive sync failed'),
  });

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-bg-app">
      <div className="flex h-12 flex-shrink-0 items-center justify-between gap-3 border-b border-border-subtle bg-bg-surface px-4">
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border-default p-0.5">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setDriveSection(id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors',
                  driveSection === id
                    ? 'bg-bg-highlight text-text-primary'
                    : 'text-text-muted hover:text-text-primary'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {driveSection === 'browse' && (
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Drive…"
                className="h-8 w-44 rounded-md border border-border-default bg-bg-elevated pl-8 pr-3 text-[12px] text-text-primary placeholder:text-text-muted"
              />
            </div>
          )}
          <button
            type="button"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border-default text-text-muted transition-colors hover:bg-bg-highlight hover:text-text-primary disabled:opacity-50"
            title="Sync Drive"
          >
            <RefreshCw className={cn('h-4 w-4', syncMutation.isPending && 'animate-spin')} />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {driveSection === 'recent' && <DriveRecentPanel />}
        {driveSection === 'browse' && <DriveBrowsePanel searchQuery={searchQuery} />}
      </div>
    </div>
  );
}
