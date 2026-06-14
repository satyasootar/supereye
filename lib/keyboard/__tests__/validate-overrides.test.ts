import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseUserKeyOverrides } from '../validate-overrides';

describe('parseUserKeyOverrides', () => {
  it('returns empty object for invalid input', () => {
    assert.deepEqual(parseUserKeyOverrides(null), {});
    assert.deepEqual(parseUserKeyOverrides([]), {});
    assert.deepEqual(parseUserKeyOverrides('bad'), {});
  });

  it('accepts valid binding overrides', () => {
    const result = parseUserKeyOverrides({
      'global.commandPalette': [{ key: 'k', mod: true }],
      'email.next': [{ key: 'j' }],
    });
    assert.equal(result['global.commandPalette']?.[0].key, 'k');
    assert.equal(result['email.next']?.[0].key, 'j');
  });

  it('rejects unknown binding ids', () => {
    const result = parseUserKeyOverrides({
      'not.a.real.binding': [{ key: 'x' }],
    });
    assert.deepEqual(result, {});
  });

  it('rejects malformed sequences', () => {
    const result = parseUserKeyOverrides({
      'email.next': [{ key: '' }],
    });
    assert.deepEqual(result, {});
  });

  it('normalizes key casing', () => {
    const result = parseUserKeyOverrides({
      'email.prev': [{ key: 'K' }],
    });
    assert.equal(result['email.prev']?.[0].key, 'k');
  });
});
