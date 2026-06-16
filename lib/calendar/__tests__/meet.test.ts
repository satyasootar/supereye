import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractMeetLink,
  resolveEventLocation,
  buildGoogleMeetConferenceData,
} from '../meet.ts';

describe('calendar meet helpers', () => {
  it('extracts meet link from conference data', () => {
    const link = extractMeetLink({
      conferenceData: {
        entryPoints: [{ entryPointType: 'video', uri: 'https://meet.google.com/abc-def' }],
      },
    });
    assert.equal(link, 'https://meet.google.com/abc-def');
  });

  it('falls back to hangoutLink', () => {
    assert.equal(
      extractMeetLink({ hangoutLink: 'https://meet.google.com/xyz' }),
      'https://meet.google.com/xyz'
    );
  });

  it('resolves location with meet link', () => {
    assert.equal(
      resolveEventLocation('Office', 'https://meet.google.com/abc'),
      'Office · https://meet.google.com/abc'
    );
    assert.equal(
      resolveEventLocation(undefined, 'https://meet.google.com/abc'),
      'https://meet.google.com/abc'
    );
  });

  it('builds conference data for meet', () => {
    const data = buildGoogleMeetConferenceData();
    assert.equal(data.createRequest?.conferenceSolutionKey?.type, 'hangoutsMeet');
    assert.ok(data.createRequest?.requestId);
  });
});
