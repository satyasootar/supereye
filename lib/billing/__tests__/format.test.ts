import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatTokens, formatCurrency, formatDate } from '../format.ts';

describe('billing format', () => {
  it('formats token counts', () => {
    assert.equal(formatTokens(500), '500');
    assert.equal(formatTokens(1500), '1.5k');
    assert.equal(formatTokens(2_500_000), '2.5M');
  });

  it('formats currency from cents', () => {
    assert.equal(formatCurrency(999), '$9.99');
    assert.equal(formatCurrency(0), '$0');
  });

  it('formats dates', () => {
    assert.equal(formatDate(null), '—');
    assert.match(formatDate('2024-06-15T12:00:00.000Z'), /Jun/);
  });
});
