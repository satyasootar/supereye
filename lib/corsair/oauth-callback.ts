import { createHmac, timingSafeEqual } from 'node:crypto';
import { processOAuthCallback } from 'corsair/oauth';
import { corsair } from '@/lib/corsair';
import { storeGithubOAuthTokens } from '@/lib/github/auth';

const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const OAUTH_STATE_MAX_AGE_MS = 600_000;

type OAuthCallbackOptions = {
  code: string;
  state: string;
  redirectUri: string;
};

type OAuthCallbackResult = {
  plugin: string;
  tenantId: string;
};

export function getOAuthCallbackUri(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL is not set');
  }
  return `${appUrl}/api/corsair/callback`;
}

function verifySignedOAuthState(
  state: string,
  kek: string
): OAuthCallbackResult | null {
  const dot = state.lastIndexOf('.');
  if (dot === -1) return null;

  const payload = state.slice(0, dot);
  const signature = state.slice(dot + 1);
  const expected = createHmac('sha256', kek).update(payload).digest('base64url');

  try {
    const actualBuf = Buffer.from(signature, 'base64url');
    const expectedBuf = Buffer.from(expected, 'base64url');
    if (
      actualBuf.length !== expectedBuf.length ||
      !timingSafeEqual(actualBuf, expectedBuf)
    ) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf-8')
    ) as { plugin?: string; tenantId?: string; iat?: number };

    if (!parsed.plugin || !parsed.tenantId) return null;
    if (
      typeof parsed.iat === 'number' &&
      Date.now() - parsed.iat > OAUTH_STATE_MAX_AGE_MS
    ) {
      return null;
    }

    return { plugin: parsed.plugin, tenantId: parsed.tenantId };
  } catch {
    return null;
  }
}

function parseGitHubTokenPayload(text: string): Record<string, string> {
  try {
    return JSON.parse(text) as Record<string, string>;
  } catch {
    return Object.fromEntries(new URLSearchParams(text));
  }
}

async function exchangeGitHubOAuthCode(
  code: string,
  redirectUri: string
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}> {
  const clientId = await corsair.keys.github.get_client_id();
  const clientSecret = await corsair.keys.github.get_client_secret();
  if (!clientId || !clientSecret) {
    throw new Error("Credentials not configured for 'github'");
  }

  const normalizedRedirectUri = redirectUri.replace(/\/$/, '');

  const response = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: code.trim(),
      redirect_uri: normalizedRedirectUri,
    }),
  });

  const text = await response.text();
  const tokenData = parseGitHubTokenPayload(text);

  if (tokenData.error) {
    throw new Error(
      tokenData.error_description ||
        tokenData.error ||
        'GitHub OAuth token exchange failed'
    );
  }

  if (!response.ok) {
    throw new Error(`Token exchange failed (${response.status}): ${text}`);
  }

  if (!tokenData.access_token) {
    throw new Error(
      `No access_token returned from github${text ? `: ${text.slice(0, 200)}` : ''}`
    );
  }

  return {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_in: tokenData.expires_in ? Number(tokenData.expires_in) : undefined,
  };
}

async function completeGitHubOAuthCallback(
  options: OAuthCallbackOptions
): Promise<OAuthCallbackResult> {
  const kek = process.env.CORSAIR_KEK;
  if (!kek) throw new Error('CORSAIR_KEK is not set');

  const parsed = verifySignedOAuthState(options.state, kek);
  if (!parsed || parsed.plugin !== 'github') {
    throw new Error('Invalid or tampered state parameter');
  }

  const tokens = await exchangeGitHubOAuthCode(options.code, options.redirectUri);
  await storeGithubOAuthTokens(parsed.tenantId, tokens);

  return { plugin: 'github', tenantId: parsed.tenantId };
}

function isGitHubOAuthCallbackError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes('Token endpoint returned non-JSON response') ||
    error.message.includes('No access_token returned from github')
  );
}

/**
 * GitHub's token endpoint needs Accept: application/json. Corsair's built-in
 * exchange does not send it, so handle GitHub before calling processOAuthCallback.
 */
export async function processSupereyeOAuthCallback(
  options: OAuthCallbackOptions
): Promise<OAuthCallbackResult> {
  const kek = process.env.CORSAIR_KEK;
  if (kek) {
    const parsed = verifySignedOAuthState(options.state, kek);
    if (parsed?.plugin === 'github') {
      return completeGitHubOAuthCallback(options);
    }
  }

  try {
    return await processOAuthCallback(corsair, options);
  } catch (error) {
    if (!isGitHubOAuthCallbackError(error)) throw error;
    return completeGitHubOAuthCallback(options);
  }
}
