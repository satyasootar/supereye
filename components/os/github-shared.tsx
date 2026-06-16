'use client';

import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { GitPullRequest, CircleDot, ExternalLink } from 'lucide-react';
import type { GithubIssue, GithubPullRequest } from '@/lib/github/types';

export function githubItemKey(
  type: 'pulls' | 'issues',
  owner: string,
  repo: string,
  number: number
) {
  return `${type}:${owner}/${repo}:${number}`;
}

export function parseGithubItemKey(key: string) {
  const [type, repoPath, num] = key.split(':');
  const [owner, repo] = (repoPath ?? '').split('/');
  return { type, owner, repo, number: Number(num) };
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
  const updated = item.updatedAt
    ? formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })
    : '';

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
            {updated && <span>{updated}</span>}
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
