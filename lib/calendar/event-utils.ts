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

export function getCalendarEventStart(evt: CalendarEventTime): Date {
  if (evt.start?.dateTime) {
    return new Date(evt.start.dateTime);
  }
  if (evt.start?.date) {
    return new Date(`${evt.start.date}T00:00:00`);
  }
  return new Date();
}

/** True when the event can be edited (timed: start is in the future; all-day: on or after today). */
export function isCalendarEventEditable(evt: CalendarEventTime, now = new Date()): boolean {
  if (evt.start?.date && !evt.start.dateTime) {
    return evt.start.date >= getLocalDateString(now);
  }
  return getCalendarEventStart(evt).getTime() > now.getTime();
}

export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLocalTimeString(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export type CalendarEventDetails = CalendarEventTime & {
  summary?: string | null;
  description?: string | null;
  location?: string | null;
  colorId?: string | null;
  attendees?: Array<{ email?: string | null; displayName?: string | null }> | null;
};

export type CalendarEventFormValues = {
  summary: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  colorId: string;
  isAllDay: boolean;
};

export function calendarEventToFormValues(evt: CalendarEventDetails): CalendarEventFormValues {
  const isAllDay = !!evt.start?.date && !evt.start?.dateTime;

  if (isAllDay && evt.start?.date) {
    return {
      summary: evt.summary ?? '',
      date: evt.start.date,
      startTime: '09:00',
      endTime: '17:00',
      location: evt.location ?? '',
      description: evt.description ?? '',
      colorId: evt.colorId ?? '9',
      isAllDay: true,
    };
  }

  const start = getCalendarEventStart(evt);
  const end = evt.end?.dateTime ? new Date(evt.end.dateTime) : start;

  return {
    summary: evt.summary ?? '',
    date: getLocalDateString(start),
    startTime: getLocalTimeString(start),
    endTime: getLocalTimeString(end),
    location: evt.location ?? '',
    description: evt.description ?? '',
    colorId: evt.colorId ?? '9',
    isAllDay: false,
  };
}

export function formValuesToUpdatePayload(
  values: CalendarEventFormValues,
  attendees: Array<{ email: string }>
) {
  const payload: Record<string, unknown> = {
    summary: values.summary.trim(),
    description: values.description.trim() || undefined,
    location: values.location.trim() || undefined,
    colorId: values.colorId,
  };

  if (values.isAllDay) {
    const endDate = new Date(`${values.date}T00:00:00`);
    endDate.setDate(endDate.getDate() + 1);
    payload.start = { date: values.date };
    payload.end = { date: getLocalDateString(endDate) };
  } else {
    payload.start = { dateTime: new Date(`${values.date}T${values.startTime}:00`).toISOString() };
    payload.end = { dateTime: new Date(`${values.date}T${values.endTime}:00`).toISOString() };
  }

  if (attendees.length > 0) {
    payload.attendees = attendees;
  }

  return payload;
}
