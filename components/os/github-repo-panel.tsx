'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store/app-store';
import type { GithubRepoBundle, GithubRepoTab } from '@/lib/github/types';
import {
  GithubItemRow,
  GithubCommitRow,
  GithubReleaseRow,
  GithubWorkflowRow,
  GithubDetailPanel,
  GithubGenericDetail,
  githubItemKey,
  formatGithubTime,
} from './github-shared';
import {
  GitPullRequest,
  CircleDot,
  GitCommit,
  Tag,
  PlayCircle,
  Star,
  GitFork,
  ExternalLink,
} from 'lucide-react';

const TABS: { id: GithubRepoTab; label: string; icon: typeof GitPullRequest }[] = [
  { id: 'pulls', label: 'Pull requests', icon: GitPullRequest },
  { id: 'issues', label: 'Issues', icon: CircleDot },
  { id: 'commits', label: 'Commits', icon: GitCommit },
  { id: 'releases', label: 'Releases', icon: Tag },
  { id: 'actions', label: 'Actions', icon: PlayCircle },
];

export function GithubRepoPanel({
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
    selectedGithubRepo,
    githubRepoTab,
    setGithubRepoTab,
    selectedGithubItemKey,
    setSelectedGithubItemKey,
  } = useAppStore();

  const [owner, repo] = selectedGithubRepo?.split('/') ?? ['', ''];

  const { data, isLoading } = useQuery({
    queryKey: ['github', 'repo', owner, repo],
    queryFn: async () => {
      const res = await fetch(
        `/api/github/repo?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? 'Failed to load repository');
      }
      return res.json() as Promise<GithubRepoBundle>;
    },
    enabled: !!owner && !!repo,
  });

  const tabItems = useMemo(() => {
    if (!data) return [];
    switch (githubRepoTab) {
      case 'pulls':
        return data.pulls;
      case 'issues':
        return data.issues;
      case 'commits':
        return data.commits;
      case 'releases':
        return data.releases;
      case 'actions':
        return data.workflowRuns;
      default:
        return [];
    }
  }, [data, githubRepoTab]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return tabItems;
    const q = searchQuery.toLowerCase();
    return tabItems.filter((item) => {
      if ('title' in item) {
        return (
          item.title.toLowerCase().includes(q) ||
          String('number' in item ? item.number : '').includes(q)
        );
      }
      if ('message' in item) return item.message.toLowerCase().includes(q);
      if ('tagName' in item) return item.tagName.toLowerCase().includes(q);
      if ('name' in item) return item.name.toLowerCase().includes(q);
      return true;
    });
  }, [tabItems, searchQuery]);

  const selectedPullIssue = useMemo(() => {
    if (!selectedGithubItemKey || !data) return null;
    if (githubRepoTab !== 'pulls' && githubRepoTab !== 'issues') return null;
    const parsed = selectedGithubItemKey.split(':');
    const num = Number(parsed[2]);
    if (githubRepoTab === 'pulls') {
      return data.pulls.find((p) => p.number === num) ?? null;
    }
    return data.issues.find((i) => i.number === num) ?? null;
  }, [selectedGithubItemKey, data, githubRepoTab]);

  const selectedCommit = useMemo(() => {
    if (githubRepoTab !== 'commits' || !selectedGithubItemKey || !data) return null;
    const sha = selectedGithubItemKey.replace('commit:', '');
    return data.commits.find((c) => c.sha === sha) ?? null;
  }, [githubRepoTab, selectedGithubItemKey, data]);

  const selectedRelease = useMemo(() => {
    if (githubRepoTab !== 'releases' || !selectedGithubItemKey || !data) return null;
    const id = Number(selectedGithubItemKey.replace('release:', ''));
    return data.releases.find((r) => r.id === id) ?? null;
  }, [githubRepoTab, selectedGithubItemKey, data]);

  const selectedRun = useMemo(() => {
    if (githubRepoTab !== 'actions' || !selectedGithubItemKey || !data) return null;
    const id = Number(selectedGithubItemKey.replace('run:', ''));
    return data.workflowRuns.find((r) => r.id === id) ?? null;
  }, [githubRepoTab, selectedGithubItemKey, data]);

  const hasDetail =
    !!selectedPullIssue || !!selectedCommit || !!selectedRelease || !!selectedRun;

  const counts = data
    ? {
        pulls: data.stats.openPulls,
        issues: data.stats.openIssues,
        commits: data.commits.length,
        releases: data.releases.length,
        actions: data.workflowRuns.length,
      }
    : null;

  return (
    <>
      <div
        className="flex min-h-0 flex-col overflow-hidden border-r border-border-subtle bg-bg-surface"
        style={{ width: hasDetail ? `${splitRatio}%` : '100%' }}
      >
        {data && (
          <div className="flex-shrink-0 border-b border-border-subtle px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-[15px] font-semibold text-text-primary">
                  {data.repo.name}
                </h2>
                <p className="truncate text-[12px] text-text-muted">{data.repo.fullName}</p>
                {data.repo.description && (
                  <p className="mt-1 line-clamp-2 text-[12px] text-text-secondary">
                    {data.repo.description}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-text-muted">
                  {data.repo.language && <span>{data.repo.language}</span>}
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3" /> {data.repo.stargazersCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitFork className="h-3 w-3" /> {data.repo.forksCount}
                  </span>
                  {data.repo.pushedAt && (
                    <span>Updated {formatGithubTime(data.repo.pushedAt)}</span>
                  )}
                </div>
              </div>
              {data.repo.htmlUrl && (
                <a
                  href={data.repo.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-shrink-0 items-center gap-1 rounded-md border border-border-default px-2 py-1 text-[11px] text-text-muted hover:bg-bg-highlight hover:text-text-primary"
                >
                  GitHub
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-shrink-0 gap-0.5 overflow-x-auto border-b border-border-subtle px-2 py-1.5 custom-scrollbar">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setGithubRepoTab(id);
                setSelectedGithubItemKey(null);
              }}
              className={cn(
                'flex flex-shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors',
                githubRepoTab === id
                  ? 'bg-bg-highlight text-text-primary'
                  : 'text-text-muted hover:bg-bg-overlay hover:text-text-primary'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {counts && (
                <span className="rounded-full bg-bg-overlay px-1.5 text-[10px] tabular-nums text-text-muted">
                  {counts[id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center text-[13px] text-text-muted">
            Loading repository…
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
            <p className="text-[14px] font-medium text-text-primary">Nothing here</p>
            <p className="text-[12px] text-text-muted">
              No {githubRepoTab} in {selectedGithubRepo}.
            </p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
            {githubRepoTab === 'pulls' &&
              (filteredItems as GithubRepoBundle['pulls']).map((pull) => {
                const key = githubItemKey('pulls', pull.owner, pull.repo, pull.number);
                return (
                  <GithubItemRow
                    key={key}
                    item={pull}
                    type="pulls"
                    active={selectedGithubItemKey === key}
                    onSelect={() => setSelectedGithubItemKey(key)}
                  />
                );
              })}
            {githubRepoTab === 'issues' &&
              (filteredItems as GithubRepoBundle['issues']).map((issue) => {
                const key = githubItemKey('issues', issue.owner, issue.repo, issue.number);
                return (
                  <GithubItemRow
                    key={key}
                    item={issue}
                    type="issues"
                    active={selectedGithubItemKey === key}
                    onSelect={() => setSelectedGithubItemKey(key)}
                  />
                );
              })}
            {githubRepoTab === 'commits' &&
              (filteredItems as GithubRepoBundle['commits']).map((commit) => {
                const key = `commit:${commit.sha}`;
                return (
                  <GithubCommitRow
                    key={key}
                    commit={commit}
                    active={selectedGithubItemKey === key}
                    onSelect={() => setSelectedGithubItemKey(key)}
                  />
                );
              })}
            {githubRepoTab === 'releases' &&
              (filteredItems as GithubRepoBundle['releases']).map((release) => {
                const key = `release:${release.id}`;
                return (
                  <GithubReleaseRow
                    key={key}
                    release={release}
                    active={selectedGithubItemKey === key}
                    onSelect={() => setSelectedGithubItemKey(key)}
                  />
                );
              })}
            {githubRepoTab === 'actions' &&
              (filteredItems as GithubRepoBundle['workflowRuns']).map((run) => {
                const key = `run:${run.id}`;
                return (
                  <GithubWorkflowRow
                    key={key}
                    run={run}
                    active={selectedGithubItemKey === key}
                    onSelect={() => setSelectedGithubItemKey(key)}
                  />
                );
              })}
          </div>
        )}
      </div>

      {hasDetail && (
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
          {selectedPullIssue && (
            <GithubDetailPanel
              item={selectedPullIssue}
              type={githubRepoTab === 'pulls' ? 'pulls' : 'issues'}
            />
          )}
          {selectedCommit && (
            <GithubGenericDetail
              title={selectedCommit.message}
              subtitle={`${selectedCommit.repoFullName} · ${selectedCommit.sha.slice(0, 7)}`}
              body={selectedCommit.message}
              htmlUrl={selectedCommit.htmlUrl}
              meta={
                selectedCommit.authorLogin && (
                  <span>@{selectedCommit.authorLogin}</span>
                )
              }
            />
          )}
          {selectedRelease && (
            <GithubGenericDetail
              title={selectedRelease.name ?? selectedRelease.tagName}
              subtitle={`Release ${selectedRelease.tagName}`}
              body={selectedRelease.body}
              htmlUrl={selectedRelease.htmlUrl}
            />
          )}
          {selectedRun && (
            <GithubGenericDetail
              title={selectedRun.name}
              subtitle={selectedRun.branch ?? 'Workflow run'}
              htmlUrl={selectedRun.htmlUrl}
              meta={
                <span className="capitalize">
                  {selectedRun.conclusion ?? selectedRun.status}
                  {selectedRun.updatedAt && ` · ${formatGithubTime(selectedRun.updatedAt)}`}
                </span>
              }
            />
          )}
        </div>
      )}
    </>
  );
}
