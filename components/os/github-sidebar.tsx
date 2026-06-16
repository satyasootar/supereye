'use client';

import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store/app-store';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Inbox,
  FolderGit2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useState } from 'react';
import type { GithubRepo, GithubSection } from '@/lib/github/types';

const NAV: { id: GithubSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'repo', label: 'Repository', icon: FolderGit2 },
];

export function GithubSidebar({
  variant = 'default',
}: {
  variant?: 'default' | 'right-panel';
}) {
  const {
    githubSection,
    setGithubSection,
    selectedGithubRepo,
    openGithubRepo,
    leftSidebarCollapsed,
  } = useAppStore();

  const [repoSearch, setRepoSearch] = useState('');
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
  const filteredRepos = repoSearch.trim()
    ? repos.filter(
        (r) =>
          r.fullName.toLowerCase().includes(repoSearch.toLowerCase()) ||
          r.name.toLowerCase().includes(repoSearch.toLowerCase())
      )
    : repos;

  if (isCollapsed) {
    return (
      <div className="flex h-full w-[48px] flex-col items-center gap-2 py-3">
        {NAV.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            title={label}
            onClick={() => {
              setGithubSection(id);
              if (id === 'repo' && !selectedGithubRepo && repos[0]) {
                openGithubRepo(repos[0].fullName);
              }
            }}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
              githubSection === id
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
            onClick={() => {
              setGithubSection(id);
              if (id === 'repo' && !selectedGithubRepo && repos[0]) {
                openGithubRepo(repos[0].fullName);
              }
            }}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[12px] font-medium transition-colors',
              githubSection === id
                ? 'bg-bg-highlight text-text-primary'
                : 'text-text-muted hover:bg-bg-overlay hover:text-text-primary'
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </button>
        ))}
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

      <div className="px-2 pb-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-text-muted" />
          <input
            value={repoSearch}
            onChange={(e) => setRepoSearch(e.target.value)}
            placeholder="Filter repos…"
            className="h-7 w-full rounded-md border border-border-default bg-bg-elevated pl-7 pr-2 text-[11px] text-text-primary placeholder:text-text-muted"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar px-2 pb-2">
        {isLoading ? (
          <p className="px-2 py-4 text-[12px] text-text-muted">Loading repos…</p>
        ) : filteredRepos.length === 0 ? (
          <p className="px-2 py-4 text-[12px] text-text-muted">No repositories</p>
        ) : (
          filteredRepos.map((repo) => {
            const active = selectedGithubRepo === repo.fullName;
            return (
              <button
                key={repo.id}
                type="button"
                onClick={() => openGithubRepo(repo.fullName)}
                className={cn(
                  'mb-0.5 flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors',
                  active && githubSection === 'repo'
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
