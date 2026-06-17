import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDuration,
  isRecentlyOnline,
  ONLINE_THRESHOLD_MS,
  sessionDurationSeconds,
} from '../format.ts';

describe('monitoring format', () => {
  it('formats short durations', () => {
    assert.equal(formatDuration(45), '45s');
    assert.equal(formatDuration(120), '2m');
    assert.equal(formatDuration(3661), '1h 1m');
  });

  it('detects recent online heartbeats', () => {
    const now = Date.now();
    assert.equal(isRecentlyOnline(new Date(now - 60_000), now), true);
    assert.equal(isRecentlyOnline(new Date(now - ONLINE_THRESHOLD_MS - 1), now), false);
    assert.equal(isRecentlyOnline(null, now), false);
  });

  it('computes session duration in seconds', () => {
    const start = new Date('2026-01-01T10:00:00Z');
    const end = new Date('2026-01-01T10:30:00Z');
    assert.equal(sessionDurationSeconds(start, end, end), 1800);
  });
});
