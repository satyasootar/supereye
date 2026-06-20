export const GITHUB_REPOS_PAGE_SIZE = 20;

export type GithubReposPage = {
  repos: GithubRepo[];
  page: number;
  perPage: number;
  hasMore: boolean;
};

export type GithubRepo = {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  private: boolean;
  htmlUrl: string | null;
  description: string | null;
  language: string | null;
  defaultBranch: string | null;
  openIssuesCount: number;
  stargazersCount: number;
  forksCount: number;
  updatedAt: string | null;
  pushedAt: string | null;
};

export type GithubPullRequest = {
  id: number;
  number: number;
  title: string;
  state: string;
  htmlUrl: string | null;
  body: string | null;
  draft: boolean;
  merged: boolean;
  repoFullName: string;
  owner: string;
  repo: string;
  authorLogin: string | null;
  authorAvatar: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  labels: string[];
  additions?: number;
  deletions?: number;
  changedFiles?: number;
  comments?: number;
  reviewComments?: number;
  headRef?: string | null;
  baseRef?: string | null;
};

export type GithubIssue = {
  id: number;
  number: number;
  title: string;
  state: string;
  htmlUrl: string | null;
  body: string | null;
  repoFullName: string;
  owner: string;
  repo: string;
  authorLogin: string | null;
  authorAvatar: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  labels: string[];
  comments: number;
};

export type GithubCommit = {
  sha: string;
  message: string;
  htmlUrl: string | null;
  authorLogin: string | null;
  authorAvatar: string | null;
  committedAt: string | null;
  repoFullName: string;
  owner: string;
  repo: string;
};

export type GithubRelease = {
  id: number;
  tagName: string;
  name: string | null;
  body: string | null;
  htmlUrl: string | null;
  draft: boolean;
  prerelease: boolean;
  publishedAt: string | null;
  repoFullName: string;
  owner: string;
  repo: string;
};

export type GithubWorkflowRun = {
  id: number;
  name: string;
  status: string | null;
  conclusion: string | null;
  htmlUrl: string | null;
  branch: string | null;
  event: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  repoFullName: string;
  owner: string;
  repo: string;
};

export type GithubBranch = {
  name: string;
  protected: boolean;
  sha: string | null;
};

export type GithubRepoStats = {
  openPulls: number;
  openIssues: number;
};

export type GithubContributionDay = {
  date: string;
  count: number;
};

export type GithubContributionWeek = {
  days: GithubContributionDay[];
};

export type GithubContributionsCalendar = {
  totalContributions: number;
  weeks: GithubContributionWeek[];
};

export type GithubProfile = {
  login: string;
  id: number;
  name: string | null;
  avatarUrl: string | null;
  htmlUrl: string | null;
  bio: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  twitterUsername: string | null;
  hireable: boolean | null;
  publicRepos: number;
  publicGists: number;
  followers: number;
  following: number;
  createdAt: string | null;
  updatedAt: string | null;
  planName: string | null;
  totalPrivateRepos: number | null;
  ownedPrivateRepos: number | null;
};

export type GithubStarredRepo = {
  id: number;
  fullName: string;
  name: string;
  owner: string;
  description: string | null;
  language: string | null;
  stargazersCount: number;
  htmlUrl: string | null;
  starredAt: string | null;
};

export type GithubProfileBundle = {
  profile: GithubProfile;
  contributions: GithubContributionsCalendar | null;
  starredRepos: GithubStarredRepo[];
};

export type GithubRepoBundle = {
  repo: GithubRepo;
  stats: GithubRepoStats;
  branches: GithubBranch[];
  pulls: GithubPullRequest[];
  issues: GithubIssue[];
  commits: GithubCommit[];
  releases: GithubRelease[];
  workflowRuns: GithubWorkflowRun[];
};

export type GithubOverview = {
  profile: GithubProfileBundle | null;
  repos: GithubRepo[];
  stats: {
    repoCount: number;
    openPulls: number;
    openIssues: number;
    recentCommits: number;
  };
  recentPulls: GithubPullRequest[];
  recentIssues: GithubIssue[];
  recentCommits: GithubCommit[];
  repoStats: Record<string, GithubRepoStats>;
};

export type GithubInboxItem =
  | ({ kind: 'pull' } & GithubPullRequest)
  | ({ kind: 'issue' } & GithubIssue);

export type GithubSection = 'overview' | 'inbox' | 'repo';
export type GithubRepoTab = 'pulls' | 'issues' | 'commits' | 'releases' | 'actions';
export type GithubInboxFilter = 'all' | 'pulls' | 'issues';
