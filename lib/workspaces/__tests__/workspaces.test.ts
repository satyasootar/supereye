import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateWorkspacePlugins } from '../workspaces.ts';

describe('validateWorkspacePlugins', () => {
  it('accepts connected primary only', () => {
    const result = validateWorkspacePlugins('email', null, ['email', 'calendar']);
    assert.equal(result.primary, 'email');
    assert.equal(result.sidebar, null);
  });

  it('accepts distinct connected primary and sidebar', () => {
    const result = validateWorkspacePlugins('email', 'calendar', ['email', 'calendar']);
    assert.equal(result.sidebar, 'calendar');
  });

  it('rejects unconnected primary', () => {
    assert.throws(
      () => validateWorkspacePlugins('email', null, []),
      /not connected/
    );
  });

  it('rejects same primary and sidebar', () => {
    assert.throws(
      () => validateWorkspacePlugins('email', 'email', ['email']),
      /must differ/
    );
  });

  it('rejects invalid plugin id', () => {
    assert.throws(
      () => validateWorkspacePlugins('not-real', null, ['not-real']),
      /Invalid primary/
    );
  });
});
