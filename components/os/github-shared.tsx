'use client';

import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  GitPullRequest,
  CircleDot,
  ExternalLink,
  GitCommit,
  Tag,
  PlayCircle,
  Star,
  GitFork,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import type {
  GithubCommit,
  GithubInboxItem,
  GithubIssue,
  GithubPullRequest,
  GithubRelease,
  GithubRepo,
  GithubWorkflowRun,
} from '@/lib/github/types';

export function githubItemKey(
  type: 'pulls' | 'issues',
  owner: string,
  repo: string,
  number: number
) {
  return `${type}:${owner}/${repo}:${number}`;
}

export function inboxItemKey(item: GithubInboxItem) {
  return githubItemKey(
    item.kind === 'pull' ? 'pulls' : 'issues',
    item.owner,
    item.repo,
    item.number
  );
}

export function parseGithubItemKey(key: string) {
  const [type, repoPath, num] = key.split(':');
  const [owner, repo] = (repoPath ?? '').split('/');
  return { type, owner, repo, number: Number(num) };
}

export function formatGithubTime(iso: string | null) {
  if (!iso) return '';
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

export function GithubSyncButton({
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
      title="Sync GitHub"
    >
      <span className={cn('inline-block h-3.5 w-3.5', pending && 'animate-spin')}>↻</span>
      Sync
    </button>
  );
}

export function GithubStatCard({
  label,
  value,
  accent,
  onClick,
}: {
  label: string;
  value: number | string;
  accent?: 'green' | 'blue' | 'amber' | 'muted';
  onClick?: () => void;
}) {
  const accentClass = {
    green: 'text-emerald-500',
    blue: 'text-accent-blue',
    amber: 'text-amber-500',
    muted: 'text-text-muted',
  }[accent ?? 'muted'];

  const Comp = onClick ? 'button' : 'div';

  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'flex flex-col gap-1 rounded-lg border border-border-subtle bg-bg-surface px-4 py-3 text-left transition-colors',
        onClick && 'hover:border-border-default hover:bg-bg-highlight'
      )}
    >
      <span className={cn('text-[22px] font-semibold tabular-nums leading-none', accentClass)}>
        {value}
      </span>
      <span className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
        {label}
      </span>
    </Comp>
  );
}

export function GithubRepoCard({
  repo,
  stats,
  onClick,
}: {
  repo: GithubRepo;
  stats?: { openPulls: number; openIssues: number };
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full flex-col gap-2 rounded-lg border border-border-subtle bg-bg-surface p-3 text-left transition-all hover:border-border-default hover:bg-bg-highlight"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-text-primary group-hover:text-accent-blue">
            {repo.name}
          </p>
          <p className="truncate text-[11px] text-text-muted">{repo.owner}</p>
        </div>
        {repo.language && (
          <span className="flex-shrink-0 rounded-full bg-bg-overlay px-2 py-0.5 text-[10px] font-medium text-text-secondary">
            {repo.language}
          </span>
        )}
      </div>
      {repo.description && (
        <p className="line-clamp-2 text-[12px] leading-snug text-text-muted">
          {repo.description}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-muted">
        <span className="flex items-center gap-1">
          <Star className="h-3 w-3" />
          {repo.stargazersCount}
        </span>
        <span className="flex items-center gap-1">
          <GitFork className="h-3 w-3" />
          {repo.forksCount}
        </span>
        {stats && (
          <>
            <span className="flex items-center gap-1 text-emerald-500">
              <GitPullRequest className="h-3 w-3" />
              {stats.openPulls}
            </span>
            <span className="flex items-center gap-1 text-accent-blue">
              <CircleDot className="h-3 w-3" />
              {stats.openIssues}
            </span>
          </>
        )}
        {repo.pushedAt && (
          <span className="ml-auto">{formatGithubTime(repo.pushedAt)}</span>
        )}
      </div>
    </button>
  );
}

type ItemRowProps = {
  item: GithubPullRequest | GithubIssue;
  type: 'pulls' | 'issues';
  active: boolean;
  compact?: boolean;
  onSelect: () => void;
};

export function GithubItemRow({ item, type, active, compact, onSelect }: ItemRowProps) {
  const Icon = type === 'pulls' ? GitPullRequest : CircleDot;
  const pull = type === 'pulls' ? (item as GithubPullRequest) : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full flex-col gap-1 border-b border-border-subtle px-3 py-2.5 text-left transition-colors',
        active ? 'bg-bg-highlight' : 'hover:bg-bg-overlay'
      )}
    >
      <div className="flex items-start gap-2">
        <Icon
          className={cn(
            'mt-0.5 h-4 w-4 flex-shrink-0',
            type === 'pulls' ? 'text-emerald-500' : 'text-accent-blue'
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[13px] font-medium text-text-primary">
              {item.title}
            </span>
            {pull?.draft && (
              <span className="rounded bg-bg-overlay px-1.5 py-0.5 text-[10px] text-text-muted">
                Draft
              </span>
            )}
            {!compact && item.htmlUrl && (
              <a
                href={item.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-text-muted hover:text-accent-blue"
                title="Open on GitHub"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-text-muted">
            <span>
              {item.repoFullName}#{item.number}
            </span>
            {item.authorLogin && <span>@{item.authorLogin}</span>}
            {item.updatedAt && <span>{formatGithubTime(item.updatedAt)}</span>}
          </div>
          {!compact && item.labels.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {item.labels.slice(0, 4).map((label) => (
                <span
                  key={label}
                  className="rounded-full bg-bg-overlay px-2 py-0.5 text-[10px] font-medium text-text-secondary"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export function GithubInboxRow({
  item,
  active,
  compact,
  onSelect,
}: {
  item: GithubInboxItem;
  active: boolean;
  compact?: boolean;
  onSelect: () => void;
}) {
  return (
    <GithubItemRow
      item={item}
      type={item.kind === 'pull' ? 'pulls' : 'issues'}
      active={active}
      compact={compact}
      onSelect={onSelect}
    />
  );
}

export function GithubCommitRow({
  commit,
  active,
  onSelect,
}: {
  commit: GithubCommit;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-start gap-2 border-b border-border-subtle px-3 py-2.5 text-left transition-colors',
        active ? 'bg-bg-highlight' : 'hover:bg-bg-overlay'
      )}
    >
      <GitCommit className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-muted" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-text-primary">{commit.message}</p>
        <div className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-text-muted">
          <span className="font-mono">{commit.sha.slice(0, 7)}</span>
          {commit.authorLogin && <span>@{commit.authorLogin}</span>}
          {commit.committedAt && <span>{formatGithubTime(commit.committedAt)}</span>}
        </div>
      </div>
    </button>
  );
}

export function GithubReleaseRow({
  release,
  active,
  onSelect,
}: {
  release: GithubRelease;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-start gap-2 border-b border-border-subtle px-3 py-2.5 text-left transition-colors',
        active ? 'bg-bg-highlight' : 'hover:bg-bg-overlay'
      )}
    >
      <Tag className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-text-primary">
          {release.name ?? release.tagName}
        </p>
        <div className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-text-muted">
          <span className="font-mono">{release.tagName}</span>
          {release.prerelease && <span>Pre-release</span>}
          {release.draft && <span>Draft</span>}
          {release.publishedAt && <span>{formatGithubTime(release.publishedAt)}</span>}
        </div>
      </div>
    </button>
  );
}

function workflowStatusIcon(run: GithubWorkflowRun) {
  if (run.conclusion === 'success') {
    return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  }
  if (run.conclusion === 'failure') {
    return <XCircle className="h-4 w-4 text-red-500" />;
  }
  if (run.status === 'in_progress' || run.status === 'queued') {
    return <Clock className="h-4 w-4 text-amber-500" />;
  }
  return <AlertCircle className="h-4 w-4 text-text-muted" />;
}

export function GithubWorkflowRow({
  run,
  active,
  onSelect,
}: {
  run: GithubWorkflowRun;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-start gap-2 border-b border-border-subtle px-3 py-2.5 text-left transition-colors',
        active ? 'bg-bg-highlight' : 'hover:bg-bg-overlay'
      )}
    >
      <div className="mt-0.5">{workflowStatusIcon(run)}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-text-primary">{run.name}</p>
        <div className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-text-muted">
          {run.branch && <span>{run.branch}</span>}
          {run.event && <span>{run.event}</span>}
          <span className="capitalize">{run.conclusion ?? run.status ?? 'unknown'}</span>
          {run.updatedAt && <span>{formatGithubTime(run.updatedAt)}</span>}
        </div>
      </div>
      <PlayCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-muted" />
    </button>
  );
}

export function GithubDetailPanel({
  item,
  type,
}: {
  item: GithubPullRequest | GithubIssue;
  type: 'pulls' | 'issues';
}) {
  const isPull = type === 'pulls';
  const pull = isPull ? (item as GithubPullRequest) : null;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border-subtle px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-medium text-text-muted">
              {item.repoFullName} · #{item.number}
            </p>
            <h2 className="mt-1 text-[18px] font-semibold leading-snug text-text-primary">
              {item.title}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-text-muted">
              {item.authorLogin && (
                <span className="flex items-center gap-1.5">
                  {item.authorAvatar && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.authorAvatar}
                      alt=""
                      className="h-5 w-5 rounded-full"
                    />
                  )}
                  @{item.authorLogin}
                </span>
              )}
              <span className="capitalize">{item.state}</span>
              {pull?.draft && <span>Draft</span>}
              {pull?.merged && <span>Merged</span>}
              {pull?.headRef && pull?.baseRef && (
                <span className="font-mono text-[11px]">
                  {pull.headRef} → {pull.baseRef}
                </span>
              )}
              {'comments' in item && item.comments > 0 && (
                <span>{item.comments} comments</span>
              )}
            </div>
          </div>
          {item.htmlUrl && (
            <a
              href={item.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-md border border-border-default px-3 py-1.5 text-[12px] font-medium text-text-primary transition-colors hover:bg-bg-highlight"
            >
              Open on GitHub
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
        {item.labels.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.labels.map((label) => (
              <span
                key={label}
                className="rounded-full bg-bg-overlay px-2.5 py-0.5 text-[11px] font-medium text-text-secondary"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
        {item.body ? (
          <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-text-secondary">
            {item.body}
          </pre>
        ) : (
          <p className="text-[13px] text-text-muted">No description provided.</p>
        )}
      </div>
    </div>
  );
}

export function GithubGenericDetail({
  title,
  subtitle,
  body,
  htmlUrl,
  meta,
}: {
  title: string;
  subtitle?: string;
  body?: string | null;
  htmlUrl?: string | null;
  meta?: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border-subtle px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            {subtitle && (
              <p className="text-[12px] font-medium text-text-muted">{subtitle}</p>
            )}
            <h2 className="mt-1 text-[18px] font-semibold leading-snug text-text-primary">
              {title}
            </h2>
            {meta && <div className="mt-2 text-[12px] text-text-muted">{meta}</div>}
          </div>
          {htmlUrl && (
            <a
              href={htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-md border border-border-default px-3 py-1.5 text-[12px] font-medium text-text-primary transition-colors hover:bg-bg-highlight"
            >
              Open on GitHub
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
        {body ? (
          <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-text-secondary">
            {body}
          </pre>
        ) : (
          <p className="text-[13px] text-text-muted">No additional details.</p>
        )}
      </div>
    </div>
  );
}
