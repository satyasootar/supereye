'use client';

import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Folder, File, ExternalLink, Star } from 'lucide-react';
import type { DriveItem } from '@/lib/drive/types';

export function formatDriveTime(iso: string | null) {
  if (!iso) return '';
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

export function formatDriveSize(bytes: number | null) {
  if (bytes == null || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(size >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export function DriveSyncButton({
  onSync,
  pending,
}: {
  onSync: () => void;
  pending?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSync}
      disabled={pending}
      className="flex h-8 items-center gap-1.5 rounded-md border border-border-default px-2.5 text-[12px] font-medium text-text-muted transition-colors hover:bg-bg-highlight hover:text-text-primary disabled:opacity-50"
      title="Sync Drive"
    >
      <span className={cn('inline-block h-3.5 w-3.5', pending && 'animate-spin')}>↻</span>
      Sync
    </button>
  );
}

export function DriveItemRow({
  item,
  active,
  compact,
  onSelect,
  showStar,
}: {
  item: DriveItem;
  active?: boolean;
  compact?: boolean;
  onSelect?: () => void;
  showStar?: boolean;
}) {
  const Icon = item.isFolder ? Folder : File;
  const time = formatDriveTime(item.modifiedTime);
  const size = !item.isFolder ? formatDriveSize(item.size) : null;

  const content = (
    <>
      <div
        className={cn(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
          item.isFolder ? 'bg-amber-500/10 text-amber-500' : 'bg-accent-blue/10 text-accent-blue'
        )}
      >
        {item.iconLink ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.iconLink} alt="" className="h-5 w-5 object-contain" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {showStar && <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />}
          <p
            className={cn(
              'truncate font-medium text-text-primary',
              compact ? 'text-[12px]' : 'text-[13px]'
            )}
          >
            {item.name}
          </p>
        </div>
        <p className="truncate text-[11px] text-text-muted">
          {[time, size, item.fileExtension?.toUpperCase()].filter(Boolean).join(' · ')}
        </p>
      </div>
      {item.webViewLink && !item.isFolder && (
        <a
          href={item.webViewLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0 rounded p-1 text-text-muted hover:bg-bg-overlay hover:text-text-primary"
          title="Open in Drive"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'flex w-full items-center gap-3 border-b border-border-subtle px-3 py-2.5 text-left transition-colors last:border-b-0',
          active ? 'bg-accent-blue/10' : 'hover:bg-bg-overlay'
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 border-b border-border-subtle px-3 py-2.5 last:border-b-0',
        active && 'bg-accent-blue/10'
      )}
    >
      {content}
    </div>
  );
}
