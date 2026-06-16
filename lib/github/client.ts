import { getTenant } from '@/lib/corsair';

export function getGithubApi(userId: string) {
  const tenant = getTenant(userId) as {
    github?: {
      api: {
        repositories: {
          list: (input?: Record<string, unknown>) => Promise<unknown>;
        };
        pullRequests: {
          list: (input: Record<string, unknown>) => Promise<unknown>;
          get: (input: Record<string, unknown>) => Promise<unknown>;
        };
        issues: {
          list: (input: Record<string, unknown>) => Promise<unknown>;
          get: (input: Record<string, unknown>) => Promise<unknown>;
        };
      };
    };
  };

  if (!tenant.github?.api) {
    throw new Error('GitHub is not connected for this account');
  }

  return tenant.github.api;
}
