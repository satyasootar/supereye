import { getTenant, corsair } from '@/lib/corsair';

async function getGmailAccessToken(userId: string): Promise<string | null> {
  const t = getTenant(userId);
  const getClientId = corsair.keys.gmail.get_client_id;
  const getClientSecret = corsair.keys.gmail.get_client_secret;
  const getRefreshToken = t.gmail.keys.get_refresh_token;

  const [clientId, clientSecret, refreshToken] = await Promise.all([
    getClientId(),
    getClientSecret(),
    getRefreshToken(),
  ]);

  if (!clientId || !clientSecret || !refreshToken) {
    console.warn('[Gmail Watch] Missing Google credentials, skipping watch registration.');
    return null;
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error('[Gmail Watch] Token refresh failed:', err);
    return null;
  }

  const { access_token } = (await tokenRes.json()) as { access_token: string };
  return access_token;
}

export async function registerGmailWatch(userId: string) {
  const topicName = process.env.GMAIL_PUBSUB_TOPIC;
  if (!topicName) {
    console.warn('[Gmail Watch] GMAIL_PUBSUB_TOPIC is not configured, skipping watch registration.');
    return null;
  }

  try {
    const accessToken = await getGmailAccessToken(userId);
    if (!accessToken) return null;

    const watchRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/watch', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topicName,
        labelIds: ['INBOX'],
      }),
    });

    if (!watchRes.ok) {
      const err = await watchRes.text();
      console.error('[Gmail Watch] Gmail watch failed:', err);
      return null;
    }

    const data = (await watchRes.json()) as {
      historyId?: string;
      expiration?: string;
    };

    if (data.expiration) {
      console.log(
        `[Gmail Watch] Watch registered. Expiration: ${new Date(Number(data.expiration)).toISOString()}`
      );
    }

    return data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Gmail Watch] Failed to register Gmail watch:', message);
    return null;
  }
}
