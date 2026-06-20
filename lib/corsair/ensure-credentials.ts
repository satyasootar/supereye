import { setupCorsair } from 'corsair/setup';
import { corsair } from '@/lib/corsair';

/**
 * Corsair reads OAuth app credentials from the database (encrypted), not process.env.
 * Seed/update GitHub app credentials from env before generating auth URLs.
 */
export async function ensureGithubOAuthAppConfigured(): Promise<boolean> {
  const clientId = process.env.GITHUB_CLIENT_ID?.trim();
  const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return false;

  await setupCorsair(corsair, {
    credentials: {
      github: {
        client_id: clientId,
        client_secret: clientSecret,
      },
    },
    caller: 'app',
  });

  return true;
}

export async function getGithubOAuthAppConfigured(): Promise<boolean> {
  try {
    const clientId = await corsair.keys.github.get_client_id();
    return !!clientId;
  } catch {
    return false;
  }
}
