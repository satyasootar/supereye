import { getGoogleCalendarAccessToken } from '@/lib/calendar/google-auth';
import {
  buildGoogleMeetConferenceData,
  extractMeetLink,
  resolveEventLocation,
  type GoogleCalendarEventResource,
} from '@/lib/calendar/meet';

export type CreateGoogleEventInput = {
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  attendees?: { email: string }[];
  colorId?: string;
  addGoogleMeet?: boolean;
  /** Google Calendar attendee notifications. Use 'none' when sending a separate email. */
  sendUpdates?: 'all' | 'externalOnly' | 'none';
};

export async function createGoogleCalendarEvent(
  userId: string,
  input: CreateGoogleEventInput
): Promise<GoogleCalendarEventResource> {
  const accessToken = await getGoogleCalendarAccessToken(userId);

  const event: Record<string, unknown> = {
    summary: input.summary,
    description: input.description,
    location: input.location,
    start: input.start,
    end: input.end,
    attendees: input.attendees,
    colorId: input.colorId,
  };

  if (input.addGoogleMeet) {
    event.conferenceData = buildGoogleMeetConferenceData();
  }

  const params = new URLSearchParams();
  if (input.addGoogleMeet) {
    params.set('conferenceDataVersion', '1');
  }
  if (input.sendUpdates) {
    params.set('sendUpdates', input.sendUpdates);
  } else if (input.attendees?.length) {
    params.set('sendUpdates', 'all');
  }

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events${
    params.size ? `?${params.toString()}` : ''
  }`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `Google Calendar event creation failed: ${errText || res.statusText}`
    );
  }

  const created = (await res.json()) as GoogleCalendarEventResource;
  const meetLink = extractMeetLink(created);
  if (meetLink) {
    created.location = resolveEventLocation(created.location, meetLink) ?? meetLink;
  }

  return created;
}
