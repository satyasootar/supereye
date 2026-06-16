'use client';

import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store/app-store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import {
  LayoutDashboard,
  Inbox,
  FolderGit2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import type { GithubRepo, GithubSection } from '@/lib/github/types';
import { GithubOverviewPanel } from './github-overview-panel';
import { GithubInboxPanel } from './github-inbox-panel';
import { GithubRepoPanel } from './github-repo-panel';

const SECTIONS: { id: GithubSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'repo', label: 'Repository', icon: FolderGit2 },
];

export function GithubMainPanel() {
  const {
    githubSection,
    setGithubSection,
    selectedGithubRepo,
    setSelectedGithubRepo,
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
        <FolderGit2 className="h-10 w-10 text-text-muted" />
        <h2 className="text-[16px] font-semibold text-text-primary">Connect GitHub</h2>
        <p className="max-w-sm text-[13px] text-text-muted">
          Set up your GitHub personal access token via Corsair, then sync to load repositories.
        </p>
      </div>
    );
  }

  const activeRepo = selectedGithubRepo ?? repos[0]?.fullName ?? null;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-bg-app">
      <div className="flex h-12 flex-shrink-0 items-center justify-between gap-3 border-b border-border-subtle bg-bg-surface px-4">
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border-default p-0.5">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setGithubSection(id);
                  if (id === 'repo' && !selectedGithubRepo && repos[0]) {
                    setSelectedGithubRepo(repos[0].fullName);
                  }
                }}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors',
                  githubSection === id
                    ? 'bg-bg-highlight text-text-primary'
                    : 'text-text-muted hover:text-text-primary'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {githubSection === 'repo' && (
            <select
              value={activeRepo ?? ''}
              onChange={(e) => setSelectedGithubRepo(e.target.value || null)}
              className="max-w-[200px] truncate rounded-md border border-border-default bg-bg-elevated py-1.5 pl-2.5 pr-7 text-[12px] font-medium text-text-primary"
            >
              {repos.map((r) => (
                <option key={r.id} value={r.fullName}>
                  {r.fullName}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2">
          {githubSection !== 'overview' && (
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search…"
                className="h-8 w-44 rounded-md border border-border-default bg-bg-elevated pl-8 pr-3 text-[12px] text-text-primary placeholder:text-text-muted"
              />
            </div>
          )}
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
        {githubSection === 'overview' && <GithubOverviewPanel />}
        {githubSection === 'inbox' && (
          <GithubInboxPanel
            splitRatio={splitRatio}
            isDragging={isDragging}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            searchQuery={searchQuery}
          />
        )}
        {githubSection === 'repo' && activeRepo && (
          <GithubRepoPanel
            splitRatio={splitRatio}
            isDragging={isDragging}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            searchQuery={searchQuery}
          />
        )}
        {githubSection === 'repo' && !activeRepo && (
          <div className="flex flex-1 items-center justify-center text-[13px] text-text-muted">
            Select a repository from the sidebar.
          </div>
        )}
      </div>
    </div>
  );
}
