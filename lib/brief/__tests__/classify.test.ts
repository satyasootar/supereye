import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { classifyEmailInsight } from '../classify.ts';
import { extractMeetingLinks, extractOtps } from '../extract-links.ts';

describe('brief classify', () => {
  it('detects OTP emails', () => {
    const result = classifyEmailInsight({
      subject: 'Your verification code',
      from: 'noreply@service.com',
      snippet: 'Use 482910 to sign in',
      body: 'Your verification code is 482910. Expires in 10 minutes.',
    });
    assert.equal(result.category, 'otp');
    assert.ok(result.otps.some((o) => o.code === '482910'));
  });

  it('extracts google meet links', () => {
    const links = extractMeetingLinks(
      'Join at https://meet.google.com/abc-defg-hij for standup'
    );
    assert.equal(links.length, 1);
    assert.equal(links[0].type, 'google_meet');
  });

  it('detects bank emails', () => {
    const result = classifyEmailInsight({
      subject: 'Your statement is ready',
      from: 'Chase Bank <alerts@chase.com>',
      snippet: '',
      body: 'Your monthly statement is available.',
    });
    assert.equal(result.category, 'bank');
  });
});

describe('brief extract otps', () => {
  it('returns empty without context', () => {
    assert.deepEqual(extractOtps('Hello', 'Your code is 123456'), []);
  });
});
