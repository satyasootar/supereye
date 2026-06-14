import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { KeybindingRegistry } from '../registry.ts';
import {
  stepSequenceMatches,
  stepsMatch,
  normalizeKey,
  SEQUENCE_TIMEOUT_MS,
} from '../key-parser.ts';
import {
  isEditableElement,
  resolveFocusMode,
} from '../focus-context.ts';
import type { KeybindingDefinition } from '../types.ts';

describe('key-parser', () => {
  it('normalizes space key', () => {
    assert.equal(normalizeKey(' '), 'space');
  });

  it('matches step sequences', () => {
    assert.equal(
      stepSequenceMatches(
        [{ key: 'g' }, { key: 'e' }],
        [{ key: 'g' }, { key: 'e' }]
      ),
      true
    );
    assert.equal(
      stepSequenceMatches([{ key: 'g' }], [{ key: 'g' }, { key: 'e' }]),
      false
    );
  });

  it('matches cross-platform modifier (mod ↔ ctrl/meta)', () => {
    assert.equal(
      stepsMatch({ key: 'k', ctrl: true }, { key: 'k', mod: true }),
      true
    );
    assert.equal(
      stepsMatch({ key: 'k', meta: true }, { key: 'k', mod: true }),
      true
    );
    assert.equal(
      stepsMatch({ key: 'k' }, { key: 'k', mod: true }),
      false
    );
  });

  it('uses 1.5s sequence timeout constant', () => {
    assert.equal(SEQUENCE_TIMEOUT_MS, 1500);
  });
});

describe('focus-context', () => {
  it('resolves modal mode when modal depth > 0', () => {
    assert.equal(resolveFocusMode(null, 1), 'modal');
  });

  it('resolves insert mode for textarea', () => {
    const el = {
      tagName: 'TEXTAREA',
      isContentEditable: false,
      closest: () => null,
    } as unknown as HTMLElement;
    assert.equal(isEditableElement(el), true);
    assert.equal(resolveFocusMode(el, 0), 'insert');
  });

  it('resolves command mode for non-editable', () => {
    const el = {
      tagName: 'DIV',
      isContentEditable: false,
      closest: () => null,
    } as unknown as HTMLElement;
    assert.equal(resolveFocusMode(el, 0), 'command');
  });
});

describe('KeybindingRegistry', () => {
  it('detects conflicts on duplicate sequences in same context', () => {
    const registry = new KeybindingRegistry();
    const defs: KeybindingDefinition[] = [
      {
        id: 'a',
        sequence: [{ key: 'j' }],
        contexts: ['email'],
        actionId: 'email.next',
        description: 'A',
        group: 'Email',
      },
      {
        id: 'b',
        sequence: [{ key: 'j' }],
        contexts: ['email'],
        actionId: 'email.prev',
        description: 'B',
        group: 'Email',
      },
    ];
    registry.register(defs);
    assert.equal(registry.getConflicts().length, 1);
  });

  it('prefers email context over global for scoped match', () => {
    const registry = new KeybindingRegistry();
    registry.register([
      {
        id: 'global.j',
        sequence: [{ key: 'j' }],
        contexts: ['global'],
        actionId: 'global.j',
        description: 'Global j',
        group: 'Global',
      },
      {
        id: 'email.j',
        sequence: [{ key: 'j' }],
        contexts: ['email'],
        actionId: 'email.next',
        description: 'Email j',
        group: 'Email',
      },
    ]);

    const match = registry.findMatch(
      [{ key: 'j' }],
      ['global', 'workspace', 'email'],
      { leaderActive: false, focusMode: 'command' }
    );
    assert.equal(match?.id, 'email.j');
  });

  it('finds prefix matches for sequences', () => {
    const registry = new KeybindingRegistry();
    registry.register([
      {
        id: 'seq.ge',
        sequence: [{ key: 'g' }, { key: 'e' }],
        contexts: ['workspace'],
        actionId: 'email.inbox',
        description: 'Go inbox',
        group: 'Nav',
      },
    ]);

    const prefixes = registry.findPrefixMatches(
      [{ key: 'g' }],
      ['workspace'],
      false
    );
    assert.equal(prefixes.length, 1);
  });

  it('applies user overrides', () => {
    const registry = new KeybindingRegistry();
    registry.register([
      {
        id: 'test',
        sequence: [{ key: 'a' }],
        contexts: ['global'],
        actionId: 'test',
        description: 'Test',
        group: 'Test',
      },
    ]);
    registry.remap('test', [{ key: 'b' }]);
    const binding = registry.getBinding('test');
    assert.equal(binding?.sequence[0].key, 'b');
  });
});
