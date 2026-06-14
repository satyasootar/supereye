import { corsair, getTenant } from '@/lib/corsair';

export async function getGoogleCalendarAccessToken(
  userId: string
): Promise<string> {
  const t = getTenant(userId) as {
    googlecalendar: {
      keys: { get_refresh_token: () => Promise<string | null> };
    };
  };

  const getClientId = corsair.keys.googlecalendar.get_client_id;
  const getClientSecret = corsair.keys.googlecalendar.get_client_secret;
  const getRefreshToken = t.googlecalendar.keys.get_refresh_token;

  const [clientId, clientSecret, refreshToken] = await Promise.all([
    getClientId(),
    getClientSecret(),
    getRefreshToken(),
  ]);

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Calendar is not connected');
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
    throw new Error('Failed to refresh Google Calendar token');
  }

  const { access_token } = (await tokenRes.json()) as { access_token: string };
  if (!access_token) {
    throw new Error('No access token returned from Google');
  }

  return access_token;
}
