'use client';

import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store/app-store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, useRef } from 'react';
import {
  GitPullRequest,
  CircleDot,
  RefreshCw,
  Search,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import type { GithubIssue, GithubPullRequest, GithubRepo } from '@/lib/github/types';
import {
  GithubDetailPanel,
  GithubItemRow,
  githubItemKey,
} from './github-shared';

export function GithubMainPanel() {
  const {
    githubView,
    setGithubView,
    selectedGithubRepo,
    setSelectedGithubRepo,
    selectedGithubItemKey,
    setSelectedGithubItemKey,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [splitRatio, setSplitRatio] = useState(42);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: reposData, isLoading: reposLoading } = useQuery({
    queryKey: ['github', 'repos'],
    queryFn: async () => {
      const res = await fetch('/api/github/repos');
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? 'Failed to load repositories');
      }
      return res.json() as Promise<{ repos: GithubRepo[] }>;
    },
  });

  const repos = reposData?.repos ?? [];
  const activeRepo = selectedGithubRepo ?? repos[0]?.fullName ?? null;
  const [owner, repo] = activeRepo?.split('/') ?? ['', ''];

  const { data: pullsData, isLoading: pullsLoading } = useQuery({
    queryKey: ['github', 'pulls', owner, repo],
    queryFn: async () => {
      const res = await fetch(
        `/api/github/pulls?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? 'Failed to load pull requests');
      }
      return res.json() as Promise<{ pulls: GithubPullRequest[] }>;
    },
    enabled: !!owner && !!repo && githubView === 'pulls',
  });

  const { data: issuesData, isLoading: issuesLoading } = useQuery({
    queryKey: ['github', 'issues', owner, repo],
    queryFn: async () => {
      const res = await fetch(
        `/api/github/issues?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? 'Failed to load issues');
      }
      return res.json() as Promise<{ issues: GithubIssue[] }>;
    },
    enabled: !!owner && !!repo && githubView === 'issues',
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/github/sync', { method: 'POST' });
      if (!res.ok) throw new Error('Sync failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['github'] });
      toast.success('GitHub synced');
    },
    onError: () => toast.error('GitHub sync failed'),
  });

  const items = githubView === 'pulls' ? pullsData?.pulls ?? [] : issuesData?.issues ?? [];
  const isLoading =
    reposLoading ||
    (githubView === 'pulls' ? pullsLoading : issuesLoading) ||
    !activeRepo;

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.repoFullName.toLowerCase().includes(q) ||
        String(item.number).includes(q)
    );
  }, [items, searchQuery]);

  const selectedItem = useMemo(() => {
    if (!selectedGithubItemKey) return null;
    return filteredItems.find(
      (item) =>
        githubItemKey(githubView, item.owner, item.repo, item.number) ===
        selectedGithubItemKey
    );
  }, [filteredItems, selectedGithubItemKey, githubView]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.style.userSelect = 'none';
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const ratio = ((e.clientX - rect.left) / rect.width) * 100;
    if (ratio >= 28 && ratio <= 60) setSplitRatio(ratio);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    document.body.style.userSelect = '';
  };

  if (!reposLoading && repos.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <GitPullRequest className="h-10 w-10 text-text-muted" />
        <h2 className="text-[16px] font-semibold text-text-primary">No repositories found</h2>
        <p className="max-w-sm text-[13px] text-text-muted">
          Connect GitHub and ensure your account has access to at least one repository.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-bg-app">
      <div className="flex h-12 flex-shrink-0 items-center justify-between gap-3 border-b border-border-subtle bg-bg-surface px-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={activeRepo ?? ''}
              onChange={(e) => setSelectedGithubRepo(e.target.value || null)}
              className="appearance-none rounded-md border border-border-default bg-bg-elevated py-1.5 pl-3 pr-8 text-[13px] font-medium text-text-primary"
            >
              {repos.map((r) => (
                <option key={r.id} value={r.fullName}>
                  {r.fullName}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          </div>
          <div className="flex rounded-md border border-border-default p-0.5">
            <button
              type="button"
              onClick={() => setGithubView('pulls')}
              className={cn(
                'flex items-center gap-1.5 rounded px-2.5 py-1 text-[12px] font-medium transition-colors',
                githubView === 'pulls'
                  ? 'bg-bg-highlight text-text-primary'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <GitPullRequest className="h-3.5 w-3.5" />
              Pull requests
            </button>
            <button
              type="button"
              onClick={() => setGithubView('issues')}
              className={cn(
                'flex items-center gap-1.5 rounded px-2.5 py-1 text-[12px] font-medium transition-colors',
                githubView === 'issues'
                  ? 'bg-bg-highlight text-text-primary'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <CircleDot className="h-3.5 w-3.5" />
              Issues
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search…"
              className="h-8 w-44 rounded-md border border-border-default bg-bg-elevated pl-8 pr-3 text-[12px] text-text-primary placeholder:text-text-muted"
            />
          </div>
          <button
            type="button"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border-default text-text-muted transition-colors hover:bg-bg-highlight hover:text-text-primary disabled:opacity-50"
            title="Sync GitHub"
          >
            <RefreshCw className={cn('h-4 w-4', syncMutation.isPending && 'animate-spin')} />
          </button>
        </div>
      </div>

      <div ref={containerRef} className="flex min-h-0 flex-1 overflow-hidden">
        <div
          className="flex min-h-0 flex-col overflow-hidden border-r border-border-subtle bg-bg-surface"
          style={{ width: selectedItem ? `${splitRatio}%` : '100%' }}
        >
          {isLoading ? (
            <div className="flex flex-1 items-center justify-center text-[13px] text-text-muted">
              Loading…
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
              <p className="text-[14px] font-medium text-text-primary">
                No open {githubView === 'pulls' ? 'pull requests' : 'issues'}
              </p>
              <p className="text-[12px] text-text-muted">
                You&apos;re all caught up in {activeRepo}.
              </p>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
              {filteredItems.map((item) => {
                const key = githubItemKey(githubView, item.owner, item.repo, item.number);
                return (
                  <GithubItemRow
                    key={key}
                    item={item}
                    type={githubView}
                    active={selectedGithubItemKey === key}
                    onSelect={() => setSelectedGithubItemKey(key)}
                  />
                );
              })}
            </div>
          )}
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
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            />
            <GithubDetailPanel item={selectedItem} type={githubView} />
          </div>
        )}
      </div>
    </div>
  );
}
