import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseSuperAdminEmailsFromSources } from '../constants.ts';
import { isSuperAdminEmail } from '../rbac.ts';

describe('billing super admin emails', () => {
  it('parses comma-separated emails', () => {
    const emails = parseSuperAdminEmailsFromSources(
      'Admin@Example.com, other@test.com',
      undefined
    );
    assert.deepEqual(emails, ['admin@example.com', 'other@test.com']);
  });

  it('deduplicates and merges sources', () => {
    const emails = parseSuperAdminEmailsFromSources(
      'a@test.com',
      'A@test.com, b@test.com'
    );
    assert.deepEqual(emails, ['a@test.com', 'b@test.com']);
  });

  it('isSuperAdminEmail returns false for empty email', () => {
    assert.equal(isSuperAdminEmail(null), false);
    assert.equal(isSuperAdminEmail(''), false);
  });
});
