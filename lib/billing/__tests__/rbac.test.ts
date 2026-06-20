import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  hasAdminPanelAccess,
  hasSuperAdminRole,
  hasUnlimitedAiAccess,
  parseSuperAdminEmailsFromSources,
} from '../constants.ts';
import {
  assertCanAssignRole,
  assertCanModifyTargetUser,
  AuthorizationError,
} from '../rbac.ts';

describe('billing RBAC helpers', () => {
  it('hasAdminPanelAccess includes super_admin and admin', () => {
    assert.equal(hasAdminPanelAccess('super_admin'), true);
    assert.equal(hasAdminPanelAccess('admin'), true);
    assert.equal(hasAdminPanelAccess('user'), false);
    assert.equal(hasAdminPanelAccess('enterprise_user'), false);
  });

  it('hasUnlimitedAiAccess is super_admin only', () => {
    assert.equal(hasUnlimitedAiAccess('super_admin'), true);
    assert.equal(hasUnlimitedAiAccess('admin'), false);
    assert.equal(hasUnlimitedAiAccess('user'), false);
  });

  it('hasSuperAdminRole is super_admin only', () => {
    assert.equal(hasSuperAdminRole('super_admin'), true);
    assert.equal(hasSuperAdminRole('admin'), false);
  });

  it('parseSuperAdminEmailsFromSources merges ADMIN_EMAIL alias', () => {
    const emails = parseSuperAdminEmailsFromSources(
      undefined,
      'Admin@Example.com',
      'other@test.dev'
    );
    assert.deepEqual(emails.sort(), ['admin@example.com', 'other@test.dev']);
  });

  it('admin cannot modify super_admin or admin accounts', () => {
    assert.throws(
      () =>
        assertCanModifyTargetUser({ actorRole: 'admin', targetRole: 'super_admin' }),
      AuthorizationError
    );
    assert.throws(
      () => assertCanModifyTargetUser({ actorRole: 'admin', targetRole: 'admin' }),
      AuthorizationError
    );
    assert.doesNotThrow(() =>
      assertCanModifyTargetUser({ actorRole: 'admin', targetRole: 'user' })
    );
  });

  it('super admin cannot assign super_admin role', () => {
    assert.throws(
      () => assertCanAssignRole({ actorRole: 'super_admin', newRole: 'super_admin' }),
      AuthorizationError
    );
  });

  it('only super admin can promote to admin', () => {
    assert.throws(
      () => assertCanAssignRole({ actorRole: 'admin', newRole: 'admin' }),
      AuthorizationError
    );
    assert.doesNotThrow(() =>
      assertCanAssignRole({ actorRole: 'super_admin', newRole: 'admin' })
    );
  });
});
