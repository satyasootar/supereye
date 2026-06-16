import { z } from 'zod';
import { isoDateTimeSchema, nonEmptyStringSchema, optionalTrimmedString } from './common';

const eventDateTimeSchema = z.object({
  dateTime: isoDateTimeSchema.optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  timeZone: z.string().max(64).optional(),
});

export const createCalendarEventSchema = z
  .object({
    summary: nonEmptyStringSchema.max(500),
    description: optionalTrimmedString,
    start: eventDateTimeSchema,
    end: eventDateTimeSchema,
    attendees: z
      .array(z.object({ email: z.string().email() }))
      .max(50)
      .optional(),
    location: z.string().max(500).optional(),
    colorId: z.string().max(16).optional(),
    addGoogleMeet: z.boolean().optional(),
  })
  .refine(
    (data) => {
      const start = data.start.dateTime ?? data.start.date;
      const end = data.end.dateTime ?? data.end.date;
      if (!start || !end) return false;
      return new Date(end) > new Date(start);
    },
    { message: 'Event end must be after start', path: ['end'] }
  );

export const calendarAvailabilitySchema = z.object({
  timeMin: isoDateTimeSchema,
  timeMax: isoDateTimeSchema,
  items: z
    .array(z.object({ id: z.string().trim().min(1).max(256) }))
    .min(1, 'At least one calendar item is required')
    .max(20),
});

export const calendarContactsQuerySchema = z.object({
  q: z.string().trim().max(200).default(''),
});
