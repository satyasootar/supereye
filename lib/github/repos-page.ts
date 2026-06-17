import type { GithubRepo, GithubReposPage } from '@/lib/github/types';
import { normalizeRepo } from '@/lib/github/normalize';

export function parseRepositoriesListResult(result: unknown): Record<string, unknown>[] {
  if (Array.isArray(result)) return result as Record<string, unknown>[];
  if (!result || typeof result !== 'object') return [];

  const obj = result as Record<string, unknown>;
  for (const key of ['data', 'repos', 'repositories', 'items']) {
    const value = obj[key];
    if (Array.isArray(value)) return value as Record<string, unknown>[];
  }

  return [];
}

export function resolveRepositoriesHasMore(
  result: unknown,
  reposLength: number,
  perPage: number
): boolean {
  if (result && typeof result === 'object') {
    const obj = result as Record<string, unknown>;
    if (typeof obj.hasMore === 'boolean') return obj.hasMore;

    const pagination = obj.pagination;
    if (pagination && typeof pagination === 'object') {
      const pageMeta = pagination as Record<string, unknown>;
      if (typeof pageMeta.hasNext === 'boolean') return pageMeta.hasNext;
      if (typeof pageMeta.hasMore === 'boolean') return pageMeta.hasMore;
    }
  }

  return reposLength === perPage;
}

export function buildGithubReposPage(
  result: unknown,
  page: number,
  perPage: number
): GithubReposPage {
  const repos = parseRepositoriesListResult(result).map((item) => normalizeRepo(item));

  return {
    repos,
    page,
    perPage,
    hasMore: resolveRepositoriesHasMore(result, repos.length, perPage),
  };
}
