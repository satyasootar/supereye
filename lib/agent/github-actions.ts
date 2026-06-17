import { getGithubApi } from '@/lib/github/client';
import { fetchGithubOverview, fetchGithubRepoBundle } from '@/lib/github/fetch';
import type { GithubIssue, GithubPullRequest, GithubRepo } from '@/lib/github/types';

function splitRepo(fullName: string) {
  const [owner, repo] = fullName.split('/');
  return { owner: owner ?? '', repo: repo ?? '' };
}

function prStatus(pr: GithubPullRequest): 'open' | 'closed' | 'merged' {
  if (pr.merged) return 'merged';
  return pr.state === 'closed' ? 'closed' : 'open';
}

export function summarizePullRequest(pr: GithubPullRequest) {
  return {
    number: pr.number,
    title: pr.title,
    repo: pr.repoFullName,
    state: pr.state,
    status: prStatus(pr),
    author: pr.authorLogin,
    url: pr.htmlUrl,
    branch: pr.headRef,
    base: pr.baseRef,
    updatedAt: pr.updatedAt,
    draft: pr.draft,
    labels: pr.labels,
  };
}

export function summarizeIssue(issue: GithubIssue) {
  return {
    number: issue.number,
    title: issue.title,
    repo: issue.repoFullName,
    state: issue.state,
    author: issue.authorLogin,
    url: issue.htmlUrl,
    updatedAt: issue.updatedAt,
    labels: issue.labels,
  };
}

export function summarizeRepo(repo: GithubRepo) {
  return {
    name: repo.fullName,
    description: repo.description,
    language: repo.language,
    private: repo.private,
    url: repo.htmlUrl,
    updatedAt: repo.updatedAt,
  };
}

/** List open PRs across repos (same path as the GitHub workspace panel). */
export async function listGithubPullRequestsForUser(
  userId: string,
  options?: {
    repo?: string;
    state?: 'open' | 'closed' | 'all';
    limit?: number;
  }
) {
  const api = getGithubApi(userId);
  const limit = options?.limit ?? 25;
  const state = options?.state ?? 'open';

  if (options?.repo) {
    const { owner, repo } = splitRepo(options.repo);
    if (!owner || !repo) {
      throw new Error('repo must be in owner/name format, e.g. octocat/Hello-World');
    }

    const bundle = await fetchGithubRepoBundle(api, owner, repo);
    let pulls = bundle.pulls;
    if (state === 'closed') {
      pulls = pulls.filter((p) => p.state === 'closed' && !p.merged);
    } else if (state === 'open') {
      pulls = pulls.filter((p) => p.state === 'open');
    }

    return {
      success: true,
      count: pulls.length,
      pullRequests: pulls.slice(0, limit).map(summarizePullRequest),
    };
  }

  const overview = await fetchGithubOverview(api, 15);
  let pulls = overview.recentPulls;
  if (state === 'closed') {
    pulls = pulls.filter((p) => p.state === 'closed' && !p.merged);
  } else if (state === 'open') {
    pulls = pulls.filter((p) => p.state === 'open');
  }

  return {
    success: true,
    count: pulls.length,
    stats: overview.stats,
    pullRequests: pulls.slice(0, limit).map(summarizePullRequest),
  };
}

export async function listGithubReposForUser(userId: string, options?: { limit?: number }) {
  const api = getGithubApi(userId);
  const limit = options?.limit ?? 20;
  const overview = await fetchGithubOverview(api, limit);

  return {
    success: true,
    count: overview.repos.length,
    repos: overview.repos.map(summarizeRepo),
  };
}

export async function listGithubIssuesForUser(
  userId: string,
  options?: {
    repo?: string;
    state?: 'open' | 'closed' | 'all';
    limit?: number;
  }
) {
  const api = getGithubApi(userId);
  const limit = options?.limit ?? 25;
  const state = options?.state ?? 'open';

  if (options?.repo) {
    const { owner, repo } = splitRepo(options.repo);
    if (!owner || !repo) {
      throw new Error('repo must be in owner/name format, e.g. octocat/Hello-World');
    }
    const bundle = await fetchGithubRepoBundle(api, owner, repo);
    let issues = bundle.issues;
    if (state !== 'all') {
      issues = issues.filter((i) => i.state === state);
    }
    return {
      success: true,
      count: issues.length,
      issues: issues.slice(0, limit).map(summarizeIssue),
    };
  }

  const overview = await fetchGithubOverview(api, 15);
  let issues = overview.recentIssues;
  if (state !== 'all') {
    issues = issues.filter((i) => i.state === state);
  }

  return {
    success: true,
    count: issues.length,
    stats: overview.stats,
    issues: issues.slice(0, limit).map(summarizeIssue),
  };
}
