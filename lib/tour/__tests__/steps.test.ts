import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  APP_TOUR_STEPS,
  filterTourSteps,
  interpolateTourText,
} from '../steps.ts';

describe('APP_TOUR_STEPS', () => {
  it('includes core workspace and integration topics', () => {
    const ids = APP_TOUR_STEPS.map((step) => step.id);
    assert.ok(ids.includes('welcome'));
    assert.ok(ids.includes('workspace'));
    assert.ok(ids.includes('plugin-limit'));
    assert.ok(ids.includes('eye'));
    assert.ok(ids.includes('complete'));
  });

  it('does not include removed keyboard status step', () => {
    const ids = APP_TOUR_STEPS.map((step) => step.id);
    assert.equal(ids.includes('keyboard'), false);
  });
});

describe('filterTourSteps', () => {
  it('omits two-plugin-only steps when workspace has one plugin', () => {
    const steps = filterTourSteps({ hasTwoPlugins: false, hasSecondary: false });
    const ids = steps.map((step) => step.id);
    assert.equal(ids.includes('plugin-switch'), false);
    assert.equal(ids.includes('secondary-panel'), false);
    assert.ok(ids.includes('main-panel'));
  });

  it('keeps plugin-switch when two plugins are available', () => {
    const steps = filterTourSteps({ hasTwoPlugins: true, hasSecondary: false });
    const ids = steps.map((step) => step.id);
    assert.ok(ids.includes('plugin-switch'));
    assert.equal(ids.includes('secondary-panel'), false);
  });

  it('keeps secondary panel step only when sidebar is visible', () => {
    const steps = filterTourSteps({ hasTwoPlugins: true, hasSecondary: true });
    const ids = steps.map((step) => step.id);
    assert.ok(ids.includes('secondary-panel'));
  });
});

describe('interpolateTourText', () => {
  it('replaces modifier and plugin placeholders', () => {
    const text = interpolateTourText(
      'Press {mod}+K. Max {maxPlugins} plugins.',
      { mod: 'Ctrl', maxPlugins: 2 }
    );
    assert.equal(text, 'Press Ctrl+K. Max 2 plugins.');
  });
});
