import { getIntegrationCache } from '@/lib/cache/integration-cache';
import { hasGithubAccessToken } from '@/lib/github/auth';

/** Only serve stale integration cache while GitHub is still connected. */
export async function getGithubStaleCache<T>(
  userId: string,
  cacheKey: string
): Promise<T | null> {
  if (!(await hasGithubAccessToken(userId))) return null;
  const cached = await getIntegrationCache<T>(userId, cacheKey);
  return cached?.payload ?? null;
}
