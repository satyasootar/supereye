import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hashResetToken } from '../password-reset.ts';
import { forgotPasswordSchema, resetPasswordSchema } from '../../validation/user.ts';

describe('password reset token hash', () => {
  it('produces stable sha256 hex', () => {
    const token = 'test-token-value';
    const a = hashResetToken(token);
    const b = hashResetToken(token);
    assert.equal(a, b);
    assert.match(a, /^[a-f0-9]{64}$/);
  });

  it('differs for different tokens', () => {
    assert.notEqual(hashResetToken('one'), hashResetToken('two'));
  });
});

describe('password reset validation', () => {
  it('validates forgot password email', () => {
    assert.equal(forgotPasswordSchema.safeParse({ email: 'user@example.com' }).success, true);
    assert.equal(forgotPasswordSchema.safeParse({ email: 'bad' }).success, false);
  });

  it('validates reset password payload', () => {
    const token = 'a'.repeat(32);
    assert.equal(
      resetPasswordSchema.safeParse({ token, newPassword: 'longenough' }).success,
      true
    );
    assert.equal(
      resetPasswordSchema.safeParse({ token, newPassword: 'short' }).success,
      false
    );
  });
});
