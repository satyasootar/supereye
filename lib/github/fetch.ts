import type { GithubApi } from '@/lib/github/client';
import {
  normalizeBranch,
  normalizeCommit,
  normalizeIssue,
  normalizePullRequest,
  normalizeRelease,
  normalizeRepo,
  normalizeWorkflowRun,
  isPullRequestIssue,
} from '@/lib/github/normalize';
import { countGithubRepositories } from '@/lib/github/repos-page';
import type {
  GithubOverview,
  GithubPullRequest,
  GithubIssue,
  GithubCommit,
  GithubRepoBundle,
  GithubRepoStats,
} from '@/lib/github/types';

function splitRepo(fullName: string) {
  const [owner, repo] = fullName.split('/');
  return { owner: owner ?? '', repo: repo ?? '' };
}

export async function fetchGithubOverview(
  api: GithubApi,
  repoLimit = 12
): Promise<GithubOverview> {
  const [reposResult, totalRepoCount] = await Promise.all([
    api.repositories.list({
      perPage: repoLimit,
      sort: 'updated',
      direction: 'desc',
    }),
    countGithubRepositories((input) => api.repositories.list(input)).catch(() => null),
  ]);

  const repos = Array.isArray(reposResult)
    ? reposResult.map((item) => normalizeRepo(item as Record<string, unknown>))
    : [];

  const recentPulls: GithubPullRequest[] = [];
  const recentIssues: GithubIssue[] = [];
  const recentCommits: GithubCommit[] = [];
  const repoStats: Record<string, GithubRepoStats> = {};

  await Promise.all(
    repos.map(async (repo) => {
      const { owner, repo: name } = splitRepo(repo.fullName);
      if (!owner || !name) return;

      try {
        const [pullResult, issueResult, commitResult] = await Promise.all([
          api.pullRequests.list({
            owner,
            repo: name,
            state: 'open',
            perPage: 8,
            sort: 'updated',
            direction: 'desc',
          }),
          api.issues.list({
            owner,
            repo: name,
            state: 'open',
            perPage: 8,
            sort: 'updated',
            direction: 'desc',
          }),
          api.repositories.listCommits({
            owner,
            repo: name,
            perPage: 3,
          }),
        ]);

        const pulls = Array.isArray(pullResult)
          ? pullResult.map((item) =>
              normalizePullRequest(item as Record<string, unknown>, owner, name)
            )
          : [];

        const issues = Array.isArray(issueResult)
          ? issueResult
              .filter((item) => !isPullRequestIssue(item as Record<string, unknown>))
              .map((item) => normalizeIssue(item as Record<string, unknown>, owner, name))
          : [];

        const commits = Array.isArray(commitResult)
          ? commitResult.map((item) =>
              normalizeCommit(item as Record<string, unknown>, owner, name)
            )
          : [];

        repoStats[repo.fullName] = {
          openPulls: pulls.length,
          openIssues: issues.length,
        };

        recentPulls.push(...pulls);
        recentIssues.push(...issues);
        recentCommits.push(...commits);
      } catch {
        repoStats[repo.fullName] = { openPulls: 0, openIssues: 0 };
      }
    })
  );

  const sortByUpdated = <T extends { updatedAt: string | null }>(a: T, b: T) =>
    new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime();

  recentPulls.sort(sortByUpdated);
  recentIssues.sort(sortByUpdated);
  recentCommits.sort(
    (a, b) =>
      new Date(b.committedAt ?? 0).getTime() - new Date(a.committedAt ?? 0).getTime()
  );

  const openPulls = Object.values(repoStats).reduce((n, s) => n + s.openPulls, 0);
  const openIssues = Object.values(repoStats).reduce((n, s) => n + s.openIssues, 0);

  return {
    repos,
    stats: {
      repoCount: totalRepoCount ?? repos.length,
      openPulls,
      openIssues,
      recentCommits: recentCommits.length,
    },
    recentPulls: recentPulls.slice(0, 25),
    recentIssues: recentIssues.slice(0, 25),
    recentCommits: recentCommits.slice(0, 15),
    repoStats,
  };
}

export async function fetchGithubRepoBundle(
  api: GithubApi,
  owner: string,
  repo: string
): Promise<GithubRepoBundle> {
  const [
    repoResult,
    branchResult,
    pullResult,
    issueResult,
    commitResult,
    releaseResult,
    workflowRunResult,
  ] = await Promise.all([
    api.repositories.get({ owner, repo }),
    api.repositories.listBranches({ owner, repo, perPage: 20 }).catch(() => []),
    api.pullRequests.list({
      owner,
      repo,
      state: 'open',
      perPage: 30,
      sort: 'updated',
      direction: 'desc',
    }),
    api.issues.list({
      owner,
      repo,
      state: 'open',
      perPage: 30,
      sort: 'updated',
      direction: 'desc',
    }),
    api.repositories.listCommits({ owner, repo, perPage: 20 }),
    api.releases.list({ owner, repo, perPage: 10 }).catch(() => []),
    api.workflows.listRuns({ owner, repo, perPage: 15 }).catch(() => ({ workflowRuns: [] })),
  ]);

  const normalizedRepo = normalizeRepo(repoResult as Record<string, unknown>);
  const pulls = Array.isArray(pullResult)
    ? pullResult.map((item) =>
        normalizePullRequest(item as Record<string, unknown>, owner, repo)
      )
    : [];
  const issues = Array.isArray(issueResult)
    ? issueResult
        .filter((item) => !isPullRequestIssue(item as Record<string, unknown>))
        .map((item) => normalizeIssue(item as Record<string, unknown>, owner, repo))
    : [];
  const commits = Array.isArray(commitResult)
    ? commitResult.map((item) =>
        normalizeCommit(item as Record<string, unknown>, owner, repo)
      )
    : [];
  const releases = Array.isArray(releaseResult)
    ? releaseResult.map((item) =>
        normalizeRelease(item as Record<string, unknown>, owner, repo)
      )
    : [];
  const runsRaw = Array.isArray(workflowRunResult)
    ? workflowRunResult
    : workflowRunResult &&
        typeof workflowRunResult === 'object' &&
        'workflowRuns' in workflowRunResult
      ? (workflowRunResult as { workflowRuns: unknown[] }).workflowRuns
      : [];
  const workflowRuns = Array.isArray(runsRaw)
    ? runsRaw.map((item) =>
        normalizeWorkflowRun(item as Record<string, unknown>, owner, repo)
      )
    : [];
  const branches = Array.isArray(branchResult)
    ? branchResult.map((item) => normalizeBranch(item as Record<string, unknown>))
    : [];

  return {
    repo: normalizedRepo,
    stats: { openPulls: pulls.length, openIssues: issues.length },
    branches,
    pulls,
    issues,
    commits,
    releases,
    workflowRuns,
  };
}
