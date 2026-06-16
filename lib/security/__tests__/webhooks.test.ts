import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  createWebhookToken,
  verifyWebhookToken,
  extractCalendarUserId,
  isGmailPubSubPayload,
  isCalendarWebhook,
} from '../webhooks.ts';

describe('security webhooks', () => {
  const originalSecret = process.env.WEBHOOK_SECRET;

  before(() => {
    process.env.WEBHOOK_SECRET = 'test-webhook-secret';
  });

  after(() => {
    if (originalSecret === undefined) delete process.env.WEBHOOK_SECRET;
    else process.env.WEBHOOK_SECRET = originalSecret;
  });

  it('creates and verifies webhook token', () => {
    const userId = 'user-123';
    const token = createWebhookToken(userId);
    assert.equal(verifyWebhookToken(userId, token), true);
    assert.equal(verifyWebhookToken(userId, 'wrong-token'), false);
    assert.equal(verifyWebhookToken('other-user', token), false);
  });

  it('extracts calendar user id from channel', () => {
    assert.equal(
      extractCalendarUserId('supereye-cal-abc-123'),
      'abc-123'
    );
    assert.equal(extractCalendarUserId('invalid'), null);
  });

  it('detects gmail pubsub payload', () => {
    assert.equal(
      isGmailPubSubPayload({ message: { data: 'abc' } }),
      true
    );
    assert.equal(isGmailPubSubPayload({ foo: 'bar' }), false);
  });

  it('detects calendar webhook headers', () => {
    const req = new Request('http://localhost', {
      headers: {
        'x-goog-channel-id': 'supereye-cal-user1',
      },
    });
    assert.equal(isCalendarWebhook(req), true);
  });
});
