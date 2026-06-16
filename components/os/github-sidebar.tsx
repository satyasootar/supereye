'use client';

import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store/app-store';
import { useQuery } from '@tanstack/react-query';
import {
  GitPullRequest,
  CircleDot,
  FolderGit2,
  RefreshCw,
} from 'lucide-react';
import type { GithubRepo } from '@/lib/github/types';

export function GithubSidebar({
  variant = 'default',
}: {
  variant?: 'default' | 'right-panel';
}) {
  const {
    githubView,
    setGithubView,
    selectedGithubRepo,
    setSelectedGithubRepo,
    leftSidebarCollapsed,
  } = useAppStore();

  const isCollapsed = variant === 'default' && leftSidebarCollapsed;

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['github', 'repos'],
    queryFn: async () => {
      const res = await fetch('/api/github/repos');
      if (!res.ok) throw new Error('Failed to load repos');
      return res.json() as Promise<{ repos: GithubRepo[] }>;
    },
  });

  const repos = data?.repos ?? [];

  if (isCollapsed) {
    return (
      <div className="flex h-full w-[48px] flex-col items-center gap-2 py-3">
        <button
          type="button"
          title="Pull requests"
          onClick={() => setGithubView('pulls')}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
            githubView === 'pulls'
              ? 'bg-bg-highlight text-emerald-500'
              : 'text-text-muted hover:bg-bg-overlay'
          )}
        >
          <GitPullRequest className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Issues"
          onClick={() => setGithubView('issues')}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
            githubView === 'issues'
              ? 'bg-bg-highlight text-accent-blue'
              : 'text-text-muted hover:bg-bg-overlay'
          )}
        >
          <CircleDot className="h-4 w-4" />
        </button>
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
      <div className="flex flex-shrink-0 gap-1 border-b border-border-subtle p-2">
        <button
          type="button"
          onClick={() => setGithubView('pulls')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[12px] font-medium transition-colors',
            githubView === 'pulls'
              ? 'bg-bg-highlight text-text-primary'
              : 'text-text-muted hover:bg-bg-overlay'
          )}
        >
          <GitPullRequest className="h-3.5 w-3.5" />
          PRs
        </button>
        <button
          type="button"
          onClick={() => setGithubView('issues')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[12px] font-medium transition-colors',
            githubView === 'issues'
              ? 'bg-bg-highlight text-text-primary'
              : 'text-text-muted hover:bg-bg-overlay'
          )}
        >
          <CircleDot className="h-3.5 w-3.5" />
          Issues
        </button>
      </div>

      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
          Repositories
        </span>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded p-1 text-text-muted hover:bg-bg-overlay hover:text-text-primary"
          title="Refresh repos"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar px-2 pb-2">
        {isLoading ? (
          <p className="px-2 py-4 text-[12px] text-text-muted">Loading repos…</p>
        ) : repos.length === 0 ? (
          <p className="px-2 py-4 text-[12px] text-text-muted">No repositories</p>
        ) : (
          repos.map((repo) => {
            const active =
              selectedGithubRepo === repo.fullName ||
              (!selectedGithubRepo && repos[0]?.fullName === repo.fullName);
            return (
              <button
                key={repo.id}
                type="button"
                onClick={() => setSelectedGithubRepo(repo.fullName)}
                className={cn(
                  'mb-0.5 flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors',
                  active
                    ? 'bg-bg-highlight text-text-primary'
                    : 'text-text-secondary hover:bg-bg-overlay hover:text-text-primary'
                )}
              >
                <FolderGit2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-muted" />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium">{repo.name}</p>
                  <p className="truncate text-[11px] text-text-muted">{repo.owner}</p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
