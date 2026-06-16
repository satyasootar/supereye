import type { GithubIssue, GithubPullRequest, GithubRepo } from '@/lib/github/types';

function parseLabel(label: unknown): string {
  if (typeof label === 'string') return label;
  if (label && typeof label === 'object' && 'name' in label) {
    const name = (label as { name?: string }).name;
    return name ?? '';
  }
  return '';
}

export function normalizeRepo(raw: Record<string, unknown>): GithubRepo {
  const owner =
    raw.owner && typeof raw.owner === 'object' && 'login' in raw.owner
      ? String((raw.owner as { login?: string }).login ?? '')
      : '';

  return {
    id: Number(raw.id),
    name: String(raw.name ?? ''),
    fullName: String(raw.fullName ?? raw.full_name ?? `${owner}/${raw.name ?? ''}`),
    owner,
    private: Boolean(raw.private),
    htmlUrl: raw.htmlUrl ? String(raw.htmlUrl) : raw.html_url ? String(raw.html_url) : null,
    description: raw.description != null ? String(raw.description) : null,
    language: raw.language != null ? String(raw.language) : null,
    defaultBranch: raw.defaultBranch
      ? String(raw.defaultBranch)
      : raw.default_branch
        ? String(raw.default_branch)
        : null,
    openIssuesCount: Number(raw.openIssuesCount ?? raw.open_issues_count ?? 0),
    updatedAt: raw.updatedAt
      ? new Date(String(raw.updatedAt)).toISOString()
      : raw.updated_at
        ? new Date(String(raw.updated_at)).toISOString()
        : null,
    pushedAt: raw.pushedAt
      ? new Date(String(raw.pushedAt)).toISOString()
      : raw.pushed_at
        ? new Date(String(raw.pushed_at)).toISOString()
        : null,
  };
}

export function normalizePullRequest(
  raw: Record<string, unknown>,
  owner: string,
  repo: string
): GithubPullRequest {
  const user =
    raw.user && typeof raw.user === 'object'
      ? (raw.user as { login?: string; avatarUrl?: string; avatar_url?: string })
      : null;

  const labels = Array.isArray(raw.labels)
    ? raw.labels.map(parseLabel).filter(Boolean)
    : [];

  return {
    id: Number(raw.id),
    number: Number(raw.number),
    title: String(raw.title ?? ''),
    state: String(raw.state ?? 'open'),
    htmlUrl: raw.htmlUrl ? String(raw.htmlUrl) : raw.html_url ? String(raw.html_url) : null,
    body: raw.body != null ? String(raw.body) : null,
    draft: Boolean(raw.draft),
    merged: Boolean(raw.merged),
    repoFullName: `${owner}/${repo}`,
    owner,
    repo,
    authorLogin: user?.login ?? null,
    authorAvatar: user?.avatarUrl ?? user?.avatar_url ?? null,
    createdAt: raw.createdAt
      ? new Date(String(raw.createdAt)).toISOString()
      : raw.created_at
        ? new Date(String(raw.created_at)).toISOString()
        : null,
    updatedAt: raw.updatedAt
      ? new Date(String(raw.updatedAt)).toISOString()
      : raw.updated_at
        ? new Date(String(raw.updated_at)).toISOString()
        : null,
    labels,
  };
}

export function normalizeIssue(
  raw: Record<string, unknown>,
  owner: string,
  repo: string
): GithubIssue {
  const user =
    raw.user && typeof raw.user === 'object'
      ? (raw.user as { login?: string; avatarUrl?: string; avatar_url?: string })
      : null;

  const labels = Array.isArray(raw.labels)
    ? raw.labels.map(parseLabel).filter(Boolean)
    : [];

  return {
    id: Number(raw.id),
    number: Number(raw.number),
    title: String(raw.title ?? ''),
    state: String(raw.state ?? 'open'),
    htmlUrl: raw.htmlUrl ? String(raw.htmlUrl) : raw.html_url ? String(raw.html_url) : null,
    body: raw.body != null ? String(raw.body) : null,
    repoFullName: `${owner}/${repo}`,
    owner,
    repo,
    authorLogin: user?.login ?? null,
    authorAvatar: user?.avatarUrl ?? user?.avatar_url ?? null,
    createdAt: raw.createdAt
      ? new Date(String(raw.createdAt)).toISOString()
      : raw.created_at
        ? new Date(String(raw.created_at)).toISOString()
        : null,
    updatedAt: raw.updatedAt
      ? new Date(String(raw.updatedAt)).toISOString()
      : raw.updated_at
        ? new Date(String(raw.updated_at)).toISOString()
        : null,
    labels,
    comments: Number(raw.comments ?? 0),
  };
}
