import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePassword,
  hashPassword,
  verifyPassword,
  MIN_PASSWORD_LENGTH,
} from '../password.ts';

describe('auth password', () => {
  it('enforces minimum length', () => {
    assert.match(validatePassword('short') ?? '', /at least/);
    assert.equal(validatePassword('a'.repeat(MIN_PASSWORD_LENGTH)), null);
  });

  it('hashes and verifies password', async () => {
    const hash = await hashPassword('my-secure-password');
    assert.match(hash, /^scrypt:/);
    assert.equal(await verifyPassword('my-secure-password', hash), true);
    assert.equal(await verifyPassword('wrong-password', hash), false);
    assert.equal(await verifyPassword('password', null), false);
  });
});
