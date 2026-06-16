import { z } from 'zod';

/** RFC-style recipients: plain email or "Name <email@example.com>" */
export const recipientsSchema = z
  .string()
  .trim()
  .min(1, 'Recipient is required')
  .max(5000, 'Recipients list is too long')
  .refine(
    (value) => {
      const parts = value.split(',').map((p) => p.trim()).filter(Boolean);
      if (parts.length === 0) return false;
      return parts.every((part) => {
        const match = part.match(/<([^>]+)>/);
        const email = (match?.[1] ?? part).trim();
        return z.string().email().safeParse(email).success;
      });
    },
    { message: 'Invalid email address in recipients' }
  );

export const emailSchema = z.string().trim().email('Invalid email address').max(254);

export const uuidSchema = z.string().uuid('Invalid id');

export const nonEmptyStringSchema = z.string().trim().min(1).max(10_000);

export const optionalTrimmedString = z.string().trim().max(10_000).optional();

export const isoDateTimeSchema = z
  .string()
  .datetime({ message: 'Invalid ISO datetime' });

export const futureIsoDateTimeSchema = isoDateTimeSchema.refine(
  (value) => new Date(value).getTime() > Date.now(),
  { message: 'Scheduled time must be in the future' }
);

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  page: z.coerce.number().int().min(1).max(10_000).optional(),
});

export const googleMessageIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[a-zA-Z0-9]+$/, 'Invalid message id');

/** Google Calendar event ids (more permissive than Gmail message ids). */
export const googleEventIdSchema = z.string().trim().min(1).max(1024);

export const pluginIdSchema = z.enum(['email', 'calendar', 'github']);

export const corsairPluginSchema = z.enum(['gmail', 'googlecalendar', 'github']);

export const userRoleSchema = z.enum(['super_admin', 'user', 'enterprise_user']);

export const emailPriorityTierSchema = z.enum(['urgent', 'can_wait']).nullable();
