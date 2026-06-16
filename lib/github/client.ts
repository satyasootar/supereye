import { getTenant } from '@/lib/corsair';

export type GithubApi = {
  repositories: {
    list: (input?: Record<string, unknown>) => Promise<unknown>;
    get: (input: Record<string, unknown>) => Promise<unknown>;
    listCommits: (input: Record<string, unknown>) => Promise<unknown>;
    listBranches: (input: Record<string, unknown>) => Promise<unknown>;
  };
  pullRequests: {
    list: (input: Record<string, unknown>) => Promise<unknown>;
    get: (input: Record<string, unknown>) => Promise<unknown>;
    listReviews: (input: Record<string, unknown>) => Promise<unknown>;
  };
  issues: {
    list: (input: Record<string, unknown>) => Promise<unknown>;
    get: (input: Record<string, unknown>) => Promise<unknown>;
  };
  releases: {
    list: (input: Record<string, unknown>) => Promise<unknown>;
    get: (input: Record<string, unknown>) => Promise<unknown>;
  };
  workflows: {
    list: (input: Record<string, unknown>) => Promise<unknown>;
    listRuns: (input: Record<string, unknown>) => Promise<unknown>;
  };
  comments: {
    listForIssue: (input: Record<string, unknown>) => Promise<unknown>;
  };
};

export function getGithubApi(userId: string): GithubApi {
  const tenant = getTenant(userId) as { github?: { api: GithubApi } };

  if (!tenant.github?.api) {
    throw new Error('GitHub is not connected for this account');
  }

  return tenant.github.api;
}
