import { extractMeetLink } from '@/lib/calendar/meet';
import { createCalendarEventForUser } from '@/lib/agent/calendar-actions';
import { sendEmailForUser, normalizeEmailAddress } from '@/lib/agent/mail-actions';
import { resolveTimeZone } from '@/lib/agent/datetime';
import type { AgentActionEmitter } from '@/lib/agent/stream-events';
import type { AgentCalendarIntent } from '@/lib/store/app-store';

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export type ConfirmDraftInput = {
  to: string | string[];
  subject: string;
  body: string;
  calendarIntent?: AgentCalendarIntent;
};

export async function executeConfirmedDraft(
  userId: string,
  input: ConfirmDraftInput,
  actions: AgentActionEmitter,
  defaultTimeZone: string
) {
  const recipients = Array.isArray(input.to)
    ? input.to.map(normalizeEmailAddress)
    : [normalizeEmailAddress(input.to)];

  let emailBody = input.body;
  let meetLink: string | null = null;

  if (input.calendarIntent) {
    const tz = resolveTimeZone(input.calendarIntent.timeZone ?? defaultTimeZone);
    const calGroupId = `cal-${Date.now()}`;
    const calActionId = actions.start({
      type: 'calendar_schedule',
      status: 'running',
      title: 'Creating calendar event',
      groupId: calGroupId,
      payload: {
        phase: 'opening',
        date: input.calendarIntent.date,
        startTime: input.calendarIntent.startTime,
        endTime: input.calendarIntent.endTime,
        summary: input.calendarIntent.summary,
        attendees: input.calendarIntent.attendees ?? recipients,
        timeZone: tz,
      },
    });

    try {
      const event = await createCalendarEventForUser(userId, {
        summary: input.calendarIntent.summary,
        date: input.calendarIntent.date,
        startTime: input.calendarIntent.startTime,
        endTime: input.calendarIntent.endTime,
        description: input.calendarIntent.description,
        attendees: input.calendarIntent.attendees ?? recipients,
        addGoogleMeet: input.calendarIntent.addGoogleMeet ?? true,
        timeZone: tz,
      });

      meetLink = extractMeetLink(event);

      if (calActionId) {
        actions.complete(calActionId, {
          title: 'Event saved',
          payload: {
            phase: 'saved',
            date: input.calendarIntent.date,
            startTime: input.calendarIntent.startTime,
            endTime: input.calendarIntent.endTime,
            summary: event.summary ?? input.calendarIntent.summary,
            attendees: input.calendarIntent.attendees ?? recipients,
            timeZone: tz,
          },
        });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create calendar event';
      if (calActionId) actions.fail(calActionId, msg);
      throw new Error(msg);
    }
  }

  if (meetLink && !emailBody.includes('meet.google.com')) {
    emailBody = `${emailBody.trim()}\n\nGoogle Meet link: ${meetLink}`;
  }

  const groupId = `email-${Date.now()}`;
  const draftId = actions.start({
    type: 'email_draft',
    status: 'running',
    title: 'Finalizing email',
    groupId,
    payload: {
      phase: 'drafting',
      to: recipients,
      subject: input.subject,
      body: emailBody,
    },
  });

  await sleep(1800);

  const sendId = actions.start({
    type: 'email_send',
    status: 'running',
    title: 'Connecting to Gmail',
    groupId,
    payload: { phase: 'connecting', to: recipients },
  });

  await sleep(700);

  if (sendId) {
    actions.update(sendId, {
      title: 'Sending message',
      payload: { phase: 'sending', to: recipients },
    });
  }

  const result = await sendEmailForUser(userId, {
    to: recipients,
    subject: input.subject,
    body: emailBody,
  });

  if (draftId) {
    actions.complete(draftId, {
      title: 'Draft complete',
      payload: {
        phase: 'complete',
        to: recipients,
        subject: input.subject,
        body: emailBody,
      },
    });
  }
  if (sendId) {
    actions.complete(sendId, {
      title: 'Email sent successfully',
      payload: { phase: 'sent', to: recipients },
    });
  }

  return { email: result, meetLink };
}
