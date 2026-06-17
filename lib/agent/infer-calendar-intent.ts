import type { AgentCalendarIntent } from '@/lib/store/app-store';
import { getTodayInTimezone, resolveTimeZone } from '@/lib/agent/datetime';

type DraftInput = {
  subject: string;
  body: string;
  to?: string[];
  calendarIntent?: AgentCalendarIntent;
};

/** Infer calendar event details when the AI drafts email but omits calendarIntent. */
export function inferCalendarIntentFromDraft(
  input: DraftInput,
  timeZone?: string
): AgentCalendarIntent | undefined {
  if (input.calendarIntent) return input.calendarIntent;

  const text = `${input.subject} ${input.body}`.toLowerCase();
  const mentionsEvent =
    /meeting|calendar|schedule|google meet|video call|event|6\s*pm|6:00|18:00|ist/.test(text);
  if (!mentionsEvent) return undefined;

  const tz = resolveTimeZone(timeZone);
  const attendees = input.to?.length ? input.to : undefined;

  let startTime = '18:00';
  let endTime = '19:00';
  if (/6\s*pm|6:00\s*pm|18:00/.test(text)) {
    startTime = '18:00';
    endTime = '19:00';
  } else if (/7\s*pm|7:00\s*pm|19:00/.test(text)) {
    startTime = '19:00';
    endTime = '20:00';
  }

  return {
    summary: input.subject.trim() || 'Meeting',
    date: getTodayInTimezone(tz),
    startTime,
    endTime,
    attendees,
    addGoogleMeet: /meet|google meet|video/.test(text),
    timeZone: tz,
  };
}
