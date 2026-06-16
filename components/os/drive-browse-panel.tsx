'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronRight, FolderOpen } from 'lucide-react';
import type { DriveBrowseResult, DriveItem } from '@/lib/drive/types';
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

export function DriveBrowsePanel({ searchQuery = '' }: { searchQuery?: string }) {
  const { selectedDriveFolderId, openDriveFolder } = useAppStore();
  const folderId = selectedDriveFolderId ?? 'root';

  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ['drive', 'search', searchQuery],
    queryFn: async () => {
      const res = await fetch(`/api/drive/search?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? 'Search failed');
      }
      return res.json() as Promise<{ items: DriveBrowseResult['items'] }>;
    },
    enabled: searchQuery.trim().length > 0,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['drive', 'files', folderId],
    queryFn: async () => {
      const res = await fetch(`/api/drive/files?folderId=${encodeURIComponent(folderId)}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? 'Failed to load folder');
      }
      return res.json() as Promise<DriveBrowseResult>;
    },
    enabled: searchQuery.trim().length === 0,
  });

  const isSearch = searchQuery.trim().length > 0;
  const items = isSearch ? (searchData?.items ?? []) : (data?.items ?? []);
  const loading = isSearch ? searchLoading : isLoading;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {!isSearch && (
        <div className="flex items-center gap-1 border-b border-border-subtle px-4 py-2 text-[12px] text-text-muted">
          <button
            type="button"
            onClick={() => openDriveFolder('root')}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-bg-overlay hover:text-text-primary"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            My Drive
          </button>
          {folderId !== 'root' && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span className="truncate text-text-secondary">Current folder</span>
            </>
          )}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex h-32 items-center justify-center text-[12px] text-text-muted">
            Loading…
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-32 items-center justify-center px-4 text-center text-[12px] text-text-muted">
            {isSearch ? 'No files match your search.' : 'This folder is empty.'}
          </div>
        ) : (
          items.map((item) => (
            <DriveItemRow
              key={item.id}
              item={item}
              onSelect={() => openDriveItem(item, openDriveFolder)}
            />
          ))
        )}
      </div>
    </div>
  );
}
