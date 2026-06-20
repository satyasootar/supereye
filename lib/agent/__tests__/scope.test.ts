import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateAgentScope,
  getAllowedAgentToolNames,
  assertRunScriptPluginAccess,
  isSupereyeAccountQuestion,
} from '../scope.ts';

describe('agent scope', () => {
  it('refuses coding requests', () => {
    const result = evaluateAgentScope('write me python code for fibonacci', [
      'email',
      'calendar',
    ]);
    assert.equal(result.allowed, false);
    if (!result.allowed) {
      assert.match(result.message, /coding/i);
    }
  });

  it('refuses weather', () => {
    const result = evaluateAgentScope('what is the weather today', ['email']);
    assert.equal(result.allowed, false);
  });

  it('allows email when gmail is connected', () => {
    const result = evaluateAgentScope('send an email to john@example.com', [
      'email',
    ]);
    assert.equal(result.allowed, true);
  });

  it('refuses github when not connected', () => {
    const result = evaluateAgentScope('list my open pull requests', ['email']);
    assert.equal(result.allowed, false);
    if (!result.allowed) {
      assert.match(result.message, /GitHub/i);
    }
  });

  it('allows github when connected', () => {
    const result = evaluateAgentScope('list my open pull requests', ['github']);
    assert.equal(result.allowed, true);
  });

  it('refuses when no integrations connected', () => {
    const result = evaluateAgentScope('summarize my inbox', []);
    assert.equal(result.allowed, false);
  });

  it('allows greetings with connected plugins', () => {
    const result = evaluateAgentScope('hello', ['email']);
    assert.equal(result.allowed, true);
  });

  it('allows plan and billing questions', () => {
    assert.equal(isSupereyeAccountQuestion('Which plan I am using?'), true);
    const result = evaluateAgentScope('Which plan I am using?', ['email']);
    assert.equal(result.allowed, true);
  });

  it('filters tools to connected plugins only', () => {
    const allowed = getAllowedAgentToolNames(['calendar']);
    assert.equal(allowed.has('get_account_summary'), true);
    assert.equal(allowed.has('send_email'), false);
    assert.equal(allowed.has('create_calendar_event'), true);
    assert.equal(allowed.has('list_github_pull_requests'), false);
  });

  it('keeps account tool when no plugins connected', () => {
    const allowed = getAllowedAgentToolNames([]);
    assert.equal(allowed.has('get_account_summary'), true);
    assert.equal(allowed.has('send_email'), false);
  });

  it('blocks run_script for disconnected plugin APIs', () => {
    assert.throws(
      () =>
        assertRunScriptPluginAccess(
          'return await tenant.github.api.pullRequests.list({})',
          ['email']
        ),
      /GitHub is not connected/
    );
  });
});
