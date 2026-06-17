import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_ACCOUNT_EMAIL, isDemoAccountEmail } from '../demo-account.ts';

describe('isDemoAccountEmail', () => {
  it('matches the configured demo account', () => {
    assert.equal(isDemoAccountEmail(DEMO_ACCOUNT_EMAIL), true);
    assert.equal(isDemoAccountEmail('kollectstech@gmail.com'), true);
    assert.equal(isDemoAccountEmail('  KollectsTech@Gmail.com  '), true);
  });

  it('rejects other emails', () => {
    assert.equal(isDemoAccountEmail('user@example.com'), false);
    assert.equal(isDemoAccountEmail(''), false);
    assert.equal(isDemoAccountEmail(null), false);
    assert.equal(isDemoAccountEmail(undefined), false);
  });
});
