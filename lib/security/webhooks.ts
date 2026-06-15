import { createHmac, timingSafeEqual } from 'crypto';

export function createWebhookToken(userId: string): string {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('WEBHOOK_SECRET is not configured');
    }
    return createHmac('sha256', 'dev-webhook-secret').update(userId).digest('hex');
  }
  return createHmac('sha256', secret).update(userId).digest('hex');
}

export function verifyWebhookToken(userId: string, token: string | null): boolean {
  if (!token) return false;

  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') return false;
    const expected = createHmac('sha256', 'dev-webhook-secret').update(userId).digest('hex');
    if (token.length !== expected.length) return false;
    try {
      return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  const expected = createHmac('sha256', secret).update(userId).digest('hex');
  if (token.length !== expected.length) return false;

  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function extractCalendarUserId(channelId: string | null): string | null {
  if (!channelId?.startsWith('supereye-cal-')) return null;
  const userId = channelId.slice('supereye-cal-'.length);
  return userId || null;
}

export function isGmailPubSubPayload(payload: Record<string, unknown>): boolean {
  const message = payload.message;
  return (
    typeof message === 'object' &&
    message !== null &&
    'data' in message &&
    typeof (message as { data?: unknown }).data === 'string'
  );
}

export function isCalendarWebhook(req: Request): boolean {
  const channelId = req.headers.get('x-goog-channel-id');
  const resourceUri = req.headers.get('x-goog-resource-uri');
  return (
    !!channelId?.startsWith('supereye-cal-') ||
    !!resourceUri?.includes('calendar')
  );
}
