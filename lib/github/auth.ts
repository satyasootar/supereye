import { createAccountKeyManager } from 'corsair/core';
import { createCorsairDatabase } from 'corsair/db';
import { ensureCorsairAccount } from '@/lib/corsair/ensure-account';
import { pool } from '@/lib/db/pool';

const GITHUB_INTEGRATION = 'github';

function getKek(): string {
  const kek = process.env.CORSAIR_KEK;
  if (!kek) {
    throw new Error('CORSAIR_KEK is not set');
  }
  return kek;
}

export function isAuthMissingError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === 'AuthMissingError' ||
    error.message.includes(`auth-missing:${GITHUB_INTEGRATION}`)
  );
}

export function getGithubAccountKeys(userId: string) {
  return createAccountKeyManager({
    authType: 'oauth_2',
    integrationName: GITHUB_INTEGRATION,
    tenantId: userId,
    kek: getKek(),
    database: createCorsairDatabase(pool),
  });
}

export async function ensureGithubAccount(userId: string): Promise<void> {
  await ensureCorsairAccount(GITHUB_INTEGRATION, userId);
}

export async function hasGithubAccessToken(userId: string): Promise<boolean> {
  try {
    const token = await getGithubAccountKeys(userId).get_access_token();
    return !!token;
  } catch {
    return false;
  }
}

export async function getGithubAccessToken(userId: string): Promise<string> {
  const token = await getGithubAccountKeys(userId).get_access_token();
  if (!token) {
    throw new Error(
      'GitHub is not connected. Open Settings → Connections and click Connect next to GitHub.'
    );
  }
  return token;
}

export async function storeGithubOAuthTokens(
  userId: string,
  tokens: {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  }
): Promise<void> {
  await ensureGithubAccount(userId);
  const keys = getGithubAccountKeys(userId);
  await keys.set_access_token(tokens.access_token);
  if (tokens.refresh_token) {
    await keys.set_refresh_token(tokens.refresh_token);
  }
  if (tokens.expires_in) {
    await keys.set_expires_at(String(Math.floor(Date.now() / 1000) + tokens.expires_in));
  }
}
