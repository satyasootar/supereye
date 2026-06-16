import type {
  GithubBranch,
  GithubCommit,
  GithubIssue,
  GithubPullRequest,
  GithubRelease,
  GithubRepo,
  GithubWorkflowRun,
} from '@/lib/github/types';

function parseLabel(label: unknown): string {
  if (typeof label === 'string') return label;
  if (label && typeof label === 'object' && 'name' in label) {
    const name = (label as { name?: string }).name;
    return name ?? '';
  }
  return '';
}

function parseUser(raw: unknown) {
  if (!raw || typeof raw !== 'object') return null;
  const u = raw as { login?: string; avatarUrl?: string; avatar_url?: string };
  return {
    login: u.login ?? null,
    avatar: u.avatarUrl ?? u.avatar_url ?? null,
  };
}

function parseDate(raw: unknown): string | null {
  if (!raw) return null;
  const d = new Date(String(raw));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
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
    stargazersCount: Number(raw.stargazersCount ?? raw.stargazers_count ?? 0),
    forksCount: Number(raw.forksCount ?? raw.forks_count ?? 0),
    updatedAt: parseDate(raw.updatedAt ?? raw.updated_at),
    pushedAt: parseDate(raw.pushedAt ?? raw.pushed_at),
  };
}

export function normalizePullRequest(
  raw: Record<string, unknown>,
  owner: string,
  repo: string
): GithubPullRequest {
  const user = parseUser(raw.user);
  const head =
    raw.head && typeof raw.head === 'object'
      ? (raw.head as { ref?: string })
      : null;
  const base =
    raw.base && typeof raw.base === 'object'
      ? (raw.base as { ref?: string })
      : null;

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
    authorAvatar: user?.avatar ?? null,
    createdAt: parseDate(raw.createdAt ?? raw.created_at),
    updatedAt: parseDate(raw.updatedAt ?? raw.updated_at),
    labels: Array.isArray(raw.labels) ? raw.labels.map(parseLabel).filter(Boolean) : [],
    additions: raw.additions != null ? Number(raw.additions) : undefined,
    deletions: raw.deletions != null ? Number(raw.deletions) : undefined,
    changedFiles: raw.changedFiles != null ? Number(raw.changedFiles) : raw.changed_files != null ? Number(raw.changed_files) : undefined,
    comments: raw.comments != null ? Number(raw.comments) : undefined,
    reviewComments: raw.reviewComments != null ? Number(raw.reviewComments) : raw.review_comments != null ? Number(raw.review_comments) : undefined,
    headRef: head?.ref ?? null,
    baseRef: base?.ref ?? null,
  };
}

export function normalizeIssue(
  raw: Record<string, unknown>,
  owner: string,
  repo: string
): GithubIssue {
  const user = parseUser(raw.user);

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
    authorAvatar: user?.avatar ?? null,
    createdAt: parseDate(raw.createdAt ?? raw.created_at),
    updatedAt: parseDate(raw.updatedAt ?? raw.updated_at),
    labels: Array.isArray(raw.labels) ? raw.labels.map(parseLabel).filter(Boolean) : [],
    comments: Number(raw.comments ?? 0),
  };
}

export function normalizeCommit(
  raw: Record<string, unknown>,
  owner: string,
  repo: string
): GithubCommit {
  const author = parseUser(raw.author);
  const commit =
    raw.commit && typeof raw.commit === 'object'
      ? (raw.commit as { message?: string; author?: { date?: string } })
      : null;

  return {
    sha: String(raw.sha ?? ''),
    message: String(commit?.message ?? raw.message ?? '').split('\n')[0] ?? '',
    htmlUrl: raw.htmlUrl ? String(raw.htmlUrl) : raw.html_url ? String(raw.html_url) : null,
    authorLogin: author?.login ?? null,
    authorAvatar: author?.avatar ?? null,
    committedAt: parseDate(commit?.author?.date ?? raw.committedAt ?? raw.committed_at),
    repoFullName: `${owner}/${repo}`,
    owner,
    repo,
  };
}

export function normalizeRelease(
  raw: Record<string, unknown>,
  owner: string,
  repo: string
): GithubRelease {
  return {
    id: Number(raw.id),
    tagName: String(raw.tagName ?? raw.tag_name ?? ''),
    name: raw.name != null ? String(raw.name) : null,
    body: raw.body != null ? String(raw.body) : null,
    htmlUrl: raw.htmlUrl ? String(raw.htmlUrl) : raw.html_url ? String(raw.html_url) : null,
    draft: Boolean(raw.draft),
    prerelease: Boolean(raw.prerelease),
    publishedAt: parseDate(raw.publishedAt ?? raw.published_at),
    repoFullName: `${owner}/${repo}`,
    owner,
    repo,
  };
}

export function normalizeWorkflowRun(
  raw: Record<string, unknown>,
  owner: string,
  repo: string
): GithubWorkflowRun {
  return {
    id: Number(raw.id),
    name: String(raw.name ?? raw.displayTitle ?? raw.display_title ?? 'Workflow'),
    status: raw.status != null ? String(raw.status) : null,
    conclusion: raw.conclusion != null ? String(raw.conclusion) : null,
    htmlUrl: raw.htmlUrl ? String(raw.htmlUrl) : raw.html_url ? String(raw.html_url) : null,
    branch: raw.headBranch ? String(raw.headBranch) : raw.head_branch ? String(raw.head_branch) : null,
    event: raw.event != null ? String(raw.event) : null,
    createdAt: parseDate(raw.createdAt ?? raw.created_at),
    updatedAt: parseDate(raw.updatedAt ?? raw.updated_at),
    repoFullName: `${owner}/${repo}`,
    owner,
    repo,
  };
}

export function normalizeBranch(raw: Record<string, unknown>): GithubBranch {
  const commit =
    raw.commit && typeof raw.commit === 'object'
      ? (raw.commit as { sha?: string })
      : null;
  return {
    name: String(raw.name ?? ''),
    protected: Boolean(raw.protected),
    sha: commit?.sha ?? null,
  };
}

export function isPullRequestIssue(raw: Record<string, unknown>) {
  return Boolean(raw.pull_request);
}
