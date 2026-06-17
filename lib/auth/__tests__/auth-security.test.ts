import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isLoginRateLimitExceeded,
  LOGIN_RATE_LIMIT_MAX_PER_EMAIL,
  LOGIN_RATE_LIMIT_MAX_PER_IP,
  hashLoginRateLimitValue,
} from '../login-rate-limit.ts';
import { isSessionVersionValid } from '../session-version.ts';
import {
  getCredentialsSignInErrorMessage,
  getSuspendedAccountMessage,
} from '../sign-in-errors.ts';

describe('login rate limit', () => {
  it('flags email limit before ip limit', () => {
    assert.equal(
      isLoginRateLimitExceeded({
        ip: LOGIN_RATE_LIMIT_MAX_PER_IP - 1,
        email: LOGIN_RATE_LIMIT_MAX_PER_EMAIL,
      }),
      'email'
    );
  });

  it('flags ip limit when email is below threshold', () => {
    assert.equal(
      isLoginRateLimitExceeded({
        ip: LOGIN_RATE_LIMIT_MAX_PER_IP,
        email: 0,
      }),
      'ip'
    );
  });

  it('allows attempts below both limits', () => {
    assert.equal(
      isLoginRateLimitExceeded({
        ip: LOGIN_RATE_LIMIT_MAX_PER_IP - 1,
        email: LOGIN_RATE_LIMIT_MAX_PER_EMAIL - 1,
      }),
      null
    );
  });

  it('normalizes email hashes consistently', () => {
    const a = hashLoginRateLimitValue('email', 'User@Example.com');
    const b = hashLoginRateLimitValue('email', 'user@example.com');
    assert.equal(a, b);
  });
});

describe('session version', () => {
  it('treats missing token version as valid for backfill', () => {
    assert.equal(isSessionVersionValid(undefined, 3), true);
  });

  it('rejects mismatched versions', () => {
    assert.equal(isSessionVersionValid(2, 3), false);
  });

  it('accepts matching versions', () => {
    assert.equal(isSessionVersionValid(4, 4), true);
  });
});

describe('sign-in errors', () => {
  it('maps rate limit codes to a friendly message', () => {
    assert.match(
      getCredentialsSignInErrorMessage('CredentialsSignin', 'rate_limited'),
      /Too many sign-in attempts/
    );
  });

  it('keeps generic invalid credentials messaging', () => {
    assert.equal(
      getCredentialsSignInErrorMessage('CredentialsSignin'),
      'Invalid email or password'
    );
  });

  it('describes suspended accounts', () => {
    assert.match(getSuspendedAccountMessage(), /suspended/i);
  });
});
