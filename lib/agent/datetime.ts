export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

export type ResolvedEventWindow = {
  timeZone: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  startUtc: Date;
  endUtc: Date;
};

export type EventTimeInput = {
  timeZone?: string;
  startDateTime?: string;
  endDateTime?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
};

export function resolveTimeZone(timeZone?: string): string {
  return timeZone?.trim() || DEFAULT_TIMEZONE;
}

export function getTodayInTimezone(timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

export function formatNowInTimezone(timeZone: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }).format(new Date());
}

export function formatDateForDisplay(date: string, timeZone: string): string {
  const utc = zonedLocalToUtc(date, '00:00', timeZone);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(utc);
}

function normalizeDate(value: string): string {
  const trimmed = value.trim();

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return trimmed;

  const indianMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (indianMatch) {
    const [, day, month, year] = indianMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  throw new Error(`Invalid date "${value}". Use YYYY-MM-DD or DD/MM/YYYY.`);
}

function normalizeTime(value: string): string {
  const trimmed = value.trim().toLowerCase();

  const twentyFour = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFour) {
    const hour = Number(twentyFour[1]);
    const minute = twentyFour[2];
    if (hour > 23) throw new Error(`Invalid time "${value}". Use HH:mm (24-hour).`);
    return `${String(hour).padStart(2, '0')}:${minute}`;
  }

  const twelve = trimmed.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
  if (twelve) {
    let hour = Number(twelve[1]);
    const minute = twelve[2];
    const meridiem = twelve[3];
    if (hour < 1 || hour > 12) throw new Error(`Invalid time "${value}".`);
    if (meridiem === 'am') {
      if (hour === 12) hour = 0;
    } else if (hour !== 12) {
      hour += 12;
    }
    return `${String(hour).padStart(2, '0')}:${minute}`;
  }

  throw new Error(`Invalid time "${value}". Use HH:mm (24-hour) or h:mm AM/PM.`);
}

function hasOffsetOrZ(value: string): boolean {
  return /(?:Z|[+-]\d{2}:\d{2})$/i.test(value.trim());
}

function toLocalDateTimeParts(value: string, timeZone: string): { date: string; time: string } {
  const trimmed = value.trim();

  if (hasOffsetOrZ(trimmed)) {
    const instant = new Date(trimmed);
    if (Number.isNaN(instant.getTime())) {
      throw new Error(`Invalid datetime "${value}".`);
    }

    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(instant);

    const year = parts.find((p) => p.type === 'year')?.value ?? '1970';
    const month = parts.find((p) => p.type === 'month')?.value ?? '01';
    const day = parts.find((p) => p.type === 'day')?.value ?? '01';
    const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
    const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
    return { date: `${year}-${month}-${day}`, time: `${hour}:${minute}` };
  }

  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{1,2}:\d{2}(?::\d{2})?)$/);
  if (match) {
    return { date: match[1], time: normalizeTime(match[2].slice(0, 5)) };
  }

  throw new Error(`Invalid datetime "${value}".`);
}

export function zonedLocalToUtc(date: string, time: string, timeZone: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);

  let guess = Date.UTC(year, month - 1, day, hour, minute, 0);

  for (let i = 0; i < 4; i++) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(new Date(guess));

    const read = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
    const target = Date.UTC(year, month - 1, day, hour, minute, 0);
    const actual = Date.UTC(read('year'), read('month') - 1, read('day'), read('hour'), read('minute'), 0);
    guess += target - actual;
  }

  return new Date(guess);
}

export function resolveEventWindow(input: EventTimeInput): ResolvedEventWindow {
  const timeZone = resolveTimeZone(input.timeZone);

  let startDate: string;
  let startTime: string;
  let endDate: string;
  let endTime: string;

  if (input.date && input.startTime && input.endTime) {
    startDate = normalizeDate(input.date);
    endDate = startDate;
    startTime = normalizeTime(input.startTime);
    endTime = normalizeTime(input.endTime);
  } else if (input.startDateTime && input.endDateTime) {
    const startParts = toLocalDateTimeParts(input.startDateTime, timeZone);
    const endParts = toLocalDateTimeParts(input.endDateTime, timeZone);
    startDate = startParts.date;
    startTime = startParts.time;
    endDate = endParts.date;
    endTime = endParts.time;
  } else {
    throw new Error(
      'Provide either date + startTime + endTime, or startDateTime + endDateTime in the user timezone.'
    );
  }

  const startUtc = zonedLocalToUtc(startDate, startTime, timeZone);
  const endUtc = zonedLocalToUtc(endDate, endTime, timeZone);

  if (endUtc <= startUtc) {
    throw new Error('End time must be after start time.');
  }

  return {
    timeZone,
    start: { dateTime: `${startDate}T${startTime}:00`, timeZone },
    end: { dateTime: `${endDate}T${endTime}:00`, timeZone },
    startUtc,
    endUtc,
  };
}
