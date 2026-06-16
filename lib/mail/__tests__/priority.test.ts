import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { stripHtml, truncateText } from '../priority.ts';

describe('mail priority helpers', () => {
  it('strips html tags', () => {
    assert.equal(stripHtml('<p>Hello <b>world</b></p>'), 'Hello world');
    assert.equal(stripHtml('<style>.x{}</style><div>Text</div>'), 'Text');
  });

  it('truncates long text', () => {
    assert.equal(truncateText('short', 10), 'short');
    const long = 'a'.repeat(20);
    const truncated = truncateText(long, 10);
    assert.equal(truncated.length, 11);
    assert.match(truncated, /…$/);
  });
});
