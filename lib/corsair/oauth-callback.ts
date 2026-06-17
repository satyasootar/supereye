import { createHmac, timingSafeEqual } from 'node:crypto';
import { processOAuthCallback } from 'corsair/oauth';
import { corsair, getTenant } from '@/lib/corsair';

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

type GitHubTenantKeys = {
  set_access_token: (token: string) => Promise<void>;
  set_refresh_token: (token: string) => Promise<void>;
  set_expires_at: (timestamp: string) => Promise<void>;
};

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

function isFormEncodedTokenError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes('Token endpoint returned non-JSON response')
  );
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
      redirect_uri: redirectUri,
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Token exchange failed (${response.status}): ${text}`);
  }

  let tokenData: Record<string, string>;
  try {
    tokenData = JSON.parse(text) as Record<string, string>;
  } catch {
    tokenData = Object.fromEntries(new URLSearchParams(text));
  }

  if (!tokenData.access_token) {
    throw new Error('No access_token returned from github');
  }

  return {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_in: tokenData.expires_in ? Number(tokenData.expires_in) : undefined,
  };
}

async function storeGitHubTokens(
  tenantId: string,
  tokens: {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  }
): Promise<void> {
  const tenant = getTenant(tenantId) as {
    github: { keys: GitHubTenantKeys };
  };

  await tenant.github.keys.set_access_token(tokens.access_token);
  if (tokens.refresh_token) {
    await tenant.github.keys.set_refresh_token(tokens.refresh_token);
  }
  if (tokens.expires_in) {
    await tenant.github.keys.set_expires_at(
      String(Math.floor(Date.now() / 1000) + tokens.expires_in)
    );
  }
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
  await storeGitHubTokens(parsed.tenantId, tokens);

  return { plugin: 'github', tenantId: parsed.tenantId };
}

/**
 * Corsair's token exchange expects JSON, but GitHub returns form-urlencoded
 * unless Accept: application/json is sent. Wrap the SDK callback and recover.
 */
export async function processSupereyeOAuthCallback(
  options: OAuthCallbackOptions
): Promise<OAuthCallbackResult> {
  try {
    return await processOAuthCallback(corsair, options);
  } catch (error) {
    if (!isFormEncodedTokenError(error)) throw error;
    return completeGitHubOAuthCallback(options);
  }
}
