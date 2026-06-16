import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidCorsairPlugin,
  workspacePluginIds,
  getPluginByCorsairName,
} from '../registry.ts';

describe('plugin registry', () => {
  it('validates corsair plugin names', () => {
    assert.equal(isValidCorsairPlugin('gmail'), true);
    assert.equal(isValidCorsairPlugin('googlecalendar'), true);
    assert.equal(isValidCorsairPlugin('slack'), false);
  });

  it('builds workspace plugin ids', () => {
    assert.deepEqual(workspacePluginIds('email', null), ['email']);
    assert.deepEqual(workspacePluginIds('email', 'calendar'), ['email', 'calendar']);
    assert.deepEqual(workspacePluginIds('email', 'email'), ['email']);
  });

  it('finds plugin by corsair integration name', () => {
    assert.equal(getPluginByCorsairName('gmail')?.id, 'email');
    assert.equal(getPluginByCorsairName('googlecalendar')?.id, 'calendar');
  });
});
