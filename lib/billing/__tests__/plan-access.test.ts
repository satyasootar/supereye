import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { planIncludesAi, planAiLabel } from '../plan-access.ts';

describe('plan AI access', () => {
  it('free plan excludes AI', () => {
    assert.equal(
      planIncludesAi({
        slug: 'free',
        monthlyTokens: 0,
        featureFlags: { ai_enabled: false, plugins_only: true },
      }),
      false
    );
  });

  it('starter plan includes AI by default', () => {
    assert.equal(
      planIncludesAi({
        slug: 'starter',
        monthlyTokens: 100_000,
        featureFlags: { ai_chat: true },
      }),
      true
    );
  });

  it('respects ai_enabled false flag', () => {
    assert.equal(
      planIncludesAi({
        slug: 'custom',
        monthlyTokens: 0,
        featureFlags: { ai_enabled: false },
      }),
      false
    );
  });

  it('planAiLabel describes capability', () => {
    assert.equal(planAiLabel({ slug: 'free', featureFlags: {} }), 'Plugins only (no AI)');
    assert.equal(planAiLabel({ slug: 'pro', featureFlags: {} }), 'AI included');
  });
});
