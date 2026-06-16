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
