export type CalendarEventTime = {
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

/** Resolve when a calendar event ends (Google all-day `end.date` is exclusive). */
export function getCalendarEventEnd(evt: CalendarEventTime, now = new Date()): Date {
  if (evt.end?.dateTime) {
    return new Date(evt.end.dateTime);
  }

  if (evt.end?.date) {
    const end = new Date(`${evt.end.date}T00:00:00`);
    end.setMilliseconds(end.getMilliseconds() - 1);
    return end;
  }

  if (evt.start?.dateTime) {
    return new Date(new Date(evt.start.dateTime).getTime() + 60 * 60 * 1000);
  }

  if (evt.start?.date) {
    return new Date(`${evt.start.date}T23:59:59.999`);
  }

  return now;
}

/** True while the event has not ended yet (includes events happening now). */
export function isCalendarEventUpcoming(evt: CalendarEventTime, now = new Date()): boolean {
  return getCalendarEventEnd(evt, now).getTime() > now.getTime();
}
