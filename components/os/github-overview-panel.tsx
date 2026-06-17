'use client';

import { useCallback, useRef } from 'react';
import { useGithubOverview, useGithubRepos } from '@/hooks/use-github-repos';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { GitPullRequest, CircleDot, GitCommit, Inbox } from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import {
  GithubRepoCard,
  GithubStatCard,
  GithubItemRow,
  GithubCommitRow,
  githubItemKey,
} from './github-shared';

export function GithubOverviewPanel() {
  const { openGithubRepo, openGithubItem, setGithubSection } = useAppStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useGithubOverview();
  const {
    repos,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useGithubRepos();

  const loadMoreRepos = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const reposSentinelRef = useInfiniteScroll({
    enabled: hasNextPage && !isFetchingNextPage,
    onLoadMore: loadMoreRepos,
    rootRef: scrollRef,
    watchKey: repos.length,
  });

  if (isLoading || !data) {
    return (
      <div className="flex flex-1 items-center justify-center text-[13px] text-text-muted">
        Loading your GitHub workspace…
      </div>
    );
  }

  const attention = [
    ...data.recentPulls.slice(0, 5).map((p) => ({ kind: 'pull' as const, item: p })),
    ...data.recentIssues.slice(0, 5).map((i) => ({ kind: 'issue' as const, item: i })),
  ]
    .sort(
      (a, b) =>
        new Date(b.item.updatedAt ?? 0).getTime() -
        new Date(a.item.updatedAt ?? 0).getTime()
    )
    .slice(0, 8);

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
      <div className="border-b border-border-subtle px-5 py-5">
        <h1 className="text-[20px] font-semibold text-text-primary">Overview</h1>
        <p className="mt-1 text-[13px] text-text-muted">
          Cross-repo snapshot — open inbox for a unified queue or pick a repository.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <GithubStatCard label="Repositories" value={data.stats.repoCount} />
          <GithubStatCard
            label="Open PRs"
            value={data.stats.openPulls}
            accent="green"
            onClick={() => setGithubSection('inbox')}
          />
          <GithubStatCard
            label="Open issues"
            value={data.stats.openIssues}
            accent="blue"
            onClick={() => setGithubSection('inbox')}
          />
          <GithubStatCard label="Recent commits" value={data.stats.recentCommits} accent="muted" />
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-2">
        <section className="border-b border-border-subtle lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-text-muted" />
              <h2 className="text-[13px] font-semibold text-text-primary">Needs attention</h2>
            </div>
            <button
              type="button"
              onClick={() => setGithubSection('inbox')}
              className="text-[12px] font-medium text-accent-blue hover:underline"
            >
              View inbox
            </button>
          </div>
          <div>
            {attention.length === 0 ? (
              <p className="px-5 py-8 text-center text-[12px] text-text-muted">
                Nothing urgent across your repos.
              </p>
            ) : (
              attention.map(({ kind, item }) => {
                const type = kind === 'pull' ? 'pulls' : 'issues';
                return (
                  <GithubItemRow
                    key={githubItemKey(type, item.owner, item.repo, item.number)}
                    item={item}
                    type={type}
                    active={false}
                    compact
                    onSelect={() =>
                      openGithubItem({
                        repoFullName: item.repoFullName,
                        kind,
                        number: item.number,
                      })
                    }
                  />
                );
              })
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 px-5 py-3">
            <GitCommit className="h-4 w-4 text-text-muted" />
            <h2 className="text-[13px] font-semibold text-text-primary">Recent commits</h2>
          </div>
          <div>
            {data.recentCommits.length === 0 ? (
              <p className="px-5 py-8 text-center text-[12px] text-text-muted">No recent commits.</p>
            ) : (
              data.recentCommits.slice(0, 6).map((commit) => (
                <GithubCommitRow
                  key={`${commit.repoFullName}:${commit.sha}`}
                  commit={commit}
                  active={false}
                  onSelect={() => openGithubRepo(commit.repoFullName, 'commits')}
                />
              ))
            )}
          </div>
        </section>
      </div>

      <section className="border-t border-border-subtle px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-text-primary">Repositories</h2>
          <div className="flex items-center gap-3 text-[11px] text-text-muted">
            <span className="flex items-center gap-1">
              <GitPullRequest className="h-3 w-3 text-emerald-500" /> PRs
            </span>
            <span className="flex items-center gap-1">
              <CircleDot className="h-3 w-3 text-accent-blue" /> Issues
            </span>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {repos.map((repo) => (
            <GithubRepoCard
              key={repo.id}
              repo={repo}
              stats={data.repoStats[repo.fullName]}
              onClick={() => openGithubRepo(repo.fullName)}
            />
          ))}
        </div>
        {hasNextPage && (
          <div ref={reposSentinelRef} className="flex min-h-10 items-center justify-center pt-2">
            {isFetchingNextPage && (
              <span className="text-[12px] text-text-muted">Loading more repositories…</span>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
