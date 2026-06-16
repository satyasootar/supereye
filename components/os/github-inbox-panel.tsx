'use client';

import { useMemo } from 'react';
import { useGithubInbox } from '@/hooks/use-github-repos';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store/app-store';
import type { GithubInboxItem } from '@/lib/github/types';
import {
  GithubInboxRow,
  GithubDetailPanel,
  inboxItemKey,
  githubItemKey,
} from './github-shared';
import { GitPullRequest, CircleDot, Layers } from 'lucide-react';

function SplitDetail({
  selectedItem,
  splitRatio,
  isDragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  children,
}: {
  selectedItem: GithubInboxItem | null;
  splitRatio: number;
  isDragging: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <div
        className="flex min-h-0 flex-col overflow-hidden border-r border-border-subtle bg-bg-surface"
        style={{ width: selectedItem ? `${splitRatio}%` : '100%' }}
      >
        {children}
      </div>
      {selectedItem && (
        <div
          className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-bg-app"
          style={{ width: `${100 - splitRatio}%` }}
        >
          <div
            className={cn(
              'absolute top-0 bottom-0 left-0 -ml-[3px] z-50 w-1.5 cursor-col-resize bg-transparent transition-colors hover:bg-accent-blue',
              isDragging && 'bg-accent-blue'
            )}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
          <GithubDetailPanel
            item={selectedItem}
            type={selectedItem.kind === 'pull' ? 'pulls' : 'issues'}
          />
        </div>
      )}
    </>
  );
}

export function GithubInboxPanel({
  splitRatio,
  isDragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  searchQuery,
}: {
  splitRatio: number;
  isDragging: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  searchQuery: string;
}) {
  const {
    githubInboxFilter,
    setGithubInboxFilter,
    selectedGithubItemKey,
    setSelectedGithubItemKey,
  } = useAppStore();

  const { data, isLoading } = useGithubInbox(githubInboxFilter);

  const items = data?.items ?? [];

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.repoFullName.toLowerCase().includes(q) ||
        String(item.number).includes(q) ||
        (item.authorLogin?.toLowerCase().includes(q) ?? false)
    );
  }, [items, searchQuery]);

  const selectedItem = useMemo(() => {
    if (!selectedGithubItemKey) return null;
    return (
      filteredItems.find((item) => inboxItemKey(item) === selectedGithubItemKey) ?? null
    );
  }, [filteredItems, selectedGithubItemKey]);

  const filters: { id: typeof githubInboxFilter; label: string; icon: typeof Layers }[] = [
    { id: 'all', label: 'All', icon: Layers },
    { id: 'pulls', label: 'PRs', icon: GitPullRequest },
    { id: 'issues', label: 'Issues', icon: CircleDot },
  ];

  return (
    <SplitDetail
      selectedItem={selectedItem}
      splitRatio={splitRatio}
      isDragging={isDragging}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="flex flex-shrink-0 items-center gap-1 border-b border-border-subtle px-3 py-2">
        {filters.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setGithubInboxFilter(id)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors',
              githubInboxFilter === id
                ? 'bg-bg-highlight text-text-primary'
                : 'text-text-muted hover:bg-bg-overlay hover:text-text-primary'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-text-muted">
          {filteredItems.length} items
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-[13px] text-text-muted">
          Loading inbox…
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="text-[14px] font-medium text-text-primary">Inbox zero</p>
          <p className="text-[12px] text-text-muted">
            No open {githubInboxFilter === 'all' ? 'items' : githubInboxFilter} across your repos.
          </p>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
          {filteredItems.map((item) => {
            const key = inboxItemKey(item);
            return (
              <GithubInboxRow
                key={key}
                item={item}
                active={selectedGithubItemKey === key}
                onSelect={() => setSelectedGithubItemKey(key)}
              />
            );
          })}
        </div>
      )}
    </SplitDetail>
  );
}
