'use client';

import { useQuery } from '@tanstack/react-query';
import { Clock, Star } from 'lucide-react';
import type { DriveItem, DriveRecentOverview } from '@/lib/drive/types';
import { DriveItemRow } from './drive-shared';
import { useAppStore } from '@/lib/store/app-store';

function openDriveItem(item: DriveItem, openDriveFolder: (id: string) => void) {
  if (item.isFolder) {
    openDriveFolder(item.id);
    return;
  }
  if (item.webViewLink) {
    window.open(item.webViewLink, '_blank', 'noopener,noreferrer');
  }
}

export function DriveRecentPanel() {
  const { openDriveFolder } = useAppStore();

  const { data, isLoading } = useQuery({
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

  if (isLoading || !data) {
    return (
      <div className="flex flex-1 items-center justify-center text-[13px] text-text-muted">
        Loading your Drive…
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
      <section className="border-b border-border-subtle">
        <div className="flex items-center gap-2 px-5 py-3">
          <Star className="h-4 w-4 text-amber-400" />
          <h2 className="text-[13px] font-semibold text-text-primary">Starred</h2>
        </div>
        {data.starred.length === 0 ? (
          <p className="px-5 pb-4 text-[12px] text-text-muted">No starred files.</p>
        ) : (
          data.starred.map((item) => (
            <DriveItemRow
              key={item.id}
              item={item}
              showStar
              onSelect={() => openDriveItem(item, openDriveFolder)}
            />
          ))
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 px-5 py-3">
          <Clock className="h-4 w-4 text-text-muted" />
          <h2 className="text-[13px] font-semibold text-text-primary">Recent</h2>
        </div>
        {data.recent.length === 0 ? (
          <p className="px-5 pb-4 text-[12px] text-text-muted">No recent files.</p>
        ) : (
          data.recent.map((item) => (
            <DriveItemRow
              key={item.id}
              item={item}
              onSelect={() => openDriveItem(item, openDriveFolder)}
            />
          ))
        )}
      </section>
    </div>
  );
}
