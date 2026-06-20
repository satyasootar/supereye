import { z } from 'zod';
import {
  futureIsoDateTimeSchema,
  googleMessageIdSchema,
  isoDateTimeSchema,
  nonEmptyStringSchema,
  optionalTrimmedString,
  recipientsSchema,
} from './common';

export const mailSendFieldsSchema = z.object({
  to: recipientsSchema,
  subject: z.string().max(998).default(''),
  text: z.string().max(500_000).default(''),
  html: z.string().max(1_000_000).optional(),
  scheduleAt: futureIsoDateTimeSchema.optional(),
  isDraft: z.boolean().default(false),
});

export const mailReplyFieldsSchema = z.object({
  replyText: nonEmptyStringSchema.max(500_000),
  html: z.string().max(1_000_000).optional(),
  threadId: googleMessageIdSchema,
  to: recipientsSchema,
  subject: z.string().trim().min(1).max(998),
  scheduleAt: futureIsoDateTimeSchema.optional(),
});

export const mailSearchQuerySchema = z.object({
  q: z.string().trim().min(1, 'Search query is required').max(500),
});

export const mailThreadsQuerySchema = z.object({
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
  category: z
    .enum([
      'ALL',
      'INBOX',
      'ARCHIVE',
      'SENT',
      'TRASH',
      'STARRED',
      'CATEGORY_PROMOTIONS',
      'CATEGORY_SOCIAL',
      'CATEGORY_UPDATES',
    ])
    .default('INBOX'),
  priority: z.enum(['urgent', 'can_wait']).optional(),
});

export const mailTriagePostSchema = z.object({
  limit: z.number().int().min(1).max(20).optional(),
  messageIds: z.array(z.string()).max(100).optional(),
}).default({});

export const mailEnhanceSchema = z.object({
  draft: z.string().trim().min(1).max(500_000),
  tone: z.enum([
    'professional',
    'friendly',
    'formal',
    'persuasive',
    'concise',
    'empathetic',
  ]),
  isHtml: z.boolean().default(false),
  subject: optionalTrimmedString,
});

export const mailTemplateCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  subject: z.string().max(998).default(''),
  htmlContent: z.string().trim().min(1).max(1_000_000),
});

export const mailTemplateUpdateSchema = mailTemplateCreateSchema.partial().refine(
  (data) => Boolean(data.name || data.subject !== undefined || data.htmlContent),
  { message: 'At least one field is required' }
);

export const mailStarSchema = z.object({
  isStarred: z.boolean().default(true),
});

export const calendarFromEmailSchema = z
  .object({
    emailId: googleMessageIdSchema,
    title: nonEmptyStringSchema.max(500),
    description: optionalTrimmedString,
    startTime: isoDateTimeSchema,
    endTime: isoDateTimeSchema,
    attendees: z.array(z.string().email()).max(50).optional(),
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: 'endTime must be after startTime',
    path: ['endTime'],
  });

export function parseMailFormFields(
  formData: FormData,
  schema: z.ZodType<{
    to: string;
    subject: string;
    text: string;
    html?: string;
    scheduleAt?: string;
    isDraft: boolean;
  }>
) {
  const scheduleRaw = formData.get('scheduleAt');
  return schema.safeParse({
    to: String(formData.get('to') ?? ''),
    subject: String(formData.get('subject') ?? ''),
    text: String(formData.get('text') ?? ''),
    html: formData.get('html') ? String(formData.get('html')) : undefined,
    scheduleAt:
      typeof scheduleRaw === 'string' && scheduleRaw.trim()
        ? scheduleRaw.trim()
        : undefined,
    isDraft: formData.get('isDraft') === 'true',
  });
}

export function parseReplyPayload(
  req: Request,
  body: unknown,
  formData: FormData | null
) {
  if (formData) {
    const scheduleRaw = formData.get('scheduleAt');
    return mailReplyFieldsSchema.safeParse({
      replyText: String(formData.get('replyText') ?? ''),
      html: formData.get('html') ? String(formData.get('html')) : undefined,
      threadId: String(formData.get('threadId') ?? ''),
      to: String(formData.get('to') ?? ''),
      subject: String(formData.get('subject') ?? ''),
      scheduleAt:
        typeof scheduleRaw === 'string' && scheduleRaw.trim()
          ? scheduleRaw.trim()
          : undefined,
    });
  }

  return mailReplyFieldsSchema.safeParse(body);
}
