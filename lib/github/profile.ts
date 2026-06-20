import type { GithubApi } from '@/lib/github/client';
import { fetchGithubContributions } from '@/lib/github/contributions';
import { normalizeGithubProfile, normalizeStarredRepo } from '@/lib/github/normalize';
import type { GithubProfileBundle } from '@/lib/github/types';

export async function fetchGithubProfileBundle(
  api: GithubApi,
  userId: string
): Promise<GithubProfileBundle | null> {
  try {
    const [userResult, starredResult, contributions] = await Promise.all([
      api.users.getAuthenticated(),
      (api.repositoriesStarred?.list ?? api.repositories.listStarred)?.({
        perPage: 6,
        sort: 'updated',
        direction: 'desc',
      }) ?? Promise.resolve([]),
      fetchGithubContributions(userId),
    ]);

    const profile = normalizeGithubProfile(userResult as Record<string, unknown>);
    const starredRepos = Array.isArray(starredResult)
      ? starredResult
          .map((item) => normalizeStarredRepo(item as Record<string, unknown>))
          .filter((repo) => repo.fullName)
      : [];

    return { profile, contributions, starredRepos };
  } catch (error) {
    console.warn('[github] profile fetch failed:', error);
    return null;
  }
}
