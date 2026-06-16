'use client';

import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store/app-store';
import { useQuery } from '@tanstack/react-query';
import { GitPullRequest, CircleDot, RefreshCw } from 'lucide-react';
import type { GithubIssue, GithubPullRequest } from '@/lib/github/types';
import { GithubItemRow, githubItemKey } from './github-shared';

export function GithubCompactPanel({ hideHeader = false }: { hideHeader?: boolean }) {
  const { githubView, setGithubView } = useAppStore();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['github', 'activity'],
    queryFn: async () => {
      const res = await fetch('/api/github/activity');
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? 'Failed to load GitHub activity');
      }
      return res.json() as Promise<{
        pulls: GithubPullRequest[];
        issues: GithubIssue[];
      }>;
    },
  });

  const items =
    githubView === 'pulls' ? data?.pulls ?? [] : data?.issues ?? [];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-bg-surface">
      {!hideHeader && (
        <div className="flex h-10 flex-shrink-0 items-center justify-between border-b border-border-subtle px-3">
          <span className="text-[12px] font-semibold text-text-primary">GitHub</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded p-1 text-text-muted hover:bg-bg-overlay hover:text-text-primary"
            title="Refresh"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
          </button>
        </div>
      )}

      <div className="flex flex-shrink-0 gap-1 border-b border-border-subtle p-2">
        <button
          type="button"
          onClick={() => setGithubView('pulls')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-[11px] font-medium transition-colors',
            githubView === 'pulls'
              ? 'bg-bg-highlight text-text-primary'
              : 'text-text-muted hover:bg-bg-overlay'
          )}
        >
          <GitPullRequest className="h-3 w-3" />
          PRs
        </button>
        <button
          type="button"
          onClick={() => setGithubView('issues')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-[11px] font-medium transition-colors',
            githubView === 'issues'
              ? 'bg-bg-highlight text-text-primary'
              : 'text-text-muted hover:bg-bg-overlay'
          )}
        >
          <CircleDot className="h-3 w-3" />
          Issues
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-[12px] text-text-muted">
            Loading…
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-32 items-center justify-center px-4 text-center text-[12px] text-text-muted">
            No open {githubView === 'pulls' ? 'pull requests' : 'issues'} across recent repos.
          </div>
        ) : (
          items.map((item) => {
            const key = githubItemKey(githubView, item.owner, item.repo, item.number);
            return (
              <GithubItemRow
                key={key}
                item={item}
                type={githubView}
                active={false}
                compact
                onSelect={() => {
                  if (item.htmlUrl) window.open(item.htmlUrl, '_blank', 'noopener,noreferrer');
                }}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
