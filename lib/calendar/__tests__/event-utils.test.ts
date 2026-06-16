import { describe, expect, it } from 'vitest';
import { getCalendarEventEnd, isCalendarEventUpcoming } from './event-utils';

describe('calendar event-utils', () => {
  const now = new Date('2026-06-16T15:00:00');

  it('treats ended timed events as not upcoming', () => {
    const evt = {
      start: { dateTime: '2026-06-16T09:00:00.000Z' },
      end: { dateTime: '2026-06-16T10:00:00.000Z' },
    };
    expect(isCalendarEventUpcoming(evt, now)).toBe(false);
  });

  it('keeps in-progress timed events upcoming', () => {
    const evt = {
      start: { dateTime: '2026-06-16T14:30:00.000Z' },
      end: { dateTime: '2026-06-16T15:30:00.000Z' },
    };
    expect(isCalendarEventUpcoming(evt, now)).toBe(true);
  });

  it('keeps future timed events upcoming', () => {
    const evt = {
      start: { dateTime: '2026-06-16T16:00:00.000Z' },
      end: { dateTime: '2026-06-16T17:00:00.000Z' },
    };
    expect(isCalendarEventUpcoming(evt, now)).toBe(true);
  });

  it('handles all-day events with exclusive end date', () => {
    const evt = {
      start: { date: '2026-06-16' },
      end: { date: '2026-06-17' },
    };
    expect(getCalendarEventEnd(evt).toISOString()).toContain('2026-06-16T23:59:59');
    expect(isCalendarEventUpcoming(evt, now)).toBe(true);

    const pastDay = new Date('2026-06-17T10:00:00');
    expect(isCalendarEventUpcoming(evt, pastDay)).toBe(false);
  });
});
