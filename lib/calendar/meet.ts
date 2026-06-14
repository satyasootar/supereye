import { randomUUID } from 'crypto';

type GoogleConferenceData = {
  createRequest?: {
    requestId: string;
    conferenceSolutionKey: { type: string };
  };
  entryPoints?: { entryPointType?: string; uri?: string }[];
};

export type GoogleCalendarEventResource = {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  attendees?: { email?: string; displayName?: string; responseStatus?: string }[];
  htmlLink?: string;
  colorId?: string;
  status?: string;
  hangoutLink?: string;
  conferenceData?: GoogleConferenceData;
};

export function buildGoogleMeetConferenceData(): GoogleConferenceData {
  return {
    createRequest: {
      requestId: randomUUID(),
      conferenceSolutionKey: { type: 'hangoutsMeet' },
    },
  };
}

export function extractMeetLink(event: GoogleCalendarEventResource): string | null {
  const video = event.conferenceData?.entryPoints?.find(
    (ep) => ep.entryPointType === 'video' && ep.uri
  );
  if (video?.uri) return video.uri;
  if (event.hangoutLink) return event.hangoutLink;
  return null;
}

export function resolveEventLocation(
  location: string | undefined,
  meetLink: string | null
): string | undefined {
  if (!meetLink) return location;
  if (!location?.trim()) return meetLink;
  if (location.includes('meet.google.com')) return location;
  return `${location.trim()} · ${meetLink}`;
}
