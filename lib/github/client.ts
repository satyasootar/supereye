import { getTenant } from '@/lib/corsair';
import {
  getGithubAccessToken as getGithubAccessTokenFromKeys,
  hasGithubAccessToken,
} from '@/lib/github/auth';

export type GithubApi = {
  repositories: {
    list: (input?: Record<string, unknown>) => Promise<unknown>;
    get: (input: Record<string, unknown>) => Promise<unknown>;
    listCommits: (input: Record<string, unknown>) => Promise<unknown>;
    listBranches: (input: Record<string, unknown>) => Promise<unknown>;
    listStarred?: (input?: Record<string, unknown>) => Promise<unknown>;
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
  users: {
    getAuthenticated: (input?: Record<string, unknown>) => Promise<unknown>;
    get: (input: Record<string, unknown>) => Promise<unknown>;
  };
  repositoriesStarred: {
    list: (input?: Record<string, unknown>) => Promise<unknown>;
  };
};

export { hasGithubAccessToken, isAuthMissingError } from '@/lib/github/auth';

export function getGithubApi(userId: string): GithubApi {
  const tenant = getTenant(userId) as { github?: { api: GithubApi } };

  if (!tenant.github?.api) {
    throw new Error(
      'GitHub is not connected. Open Settings → Connections and click Connect next to GitHub.'
    );
  }

  const api = tenant.github.api as GithubApi & {
    repositories?: GithubApi['repositories'] & {
      listStarred?: GithubApi['repositoriesStarred']['list'];
    };
  };

  if (!api.repositoriesStarred && api.repositories?.listStarred) {
    api.repositoriesStarred = { list: api.repositories.listStarred.bind(api.repositories) };
  }

  return api;
}

export async function getGithubAccessToken(userId: string): Promise<string> {
  return getGithubAccessTokenFromKeys(userId);
}
