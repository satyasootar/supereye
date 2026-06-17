import { z } from 'zod';
import { uuidSchema } from './common';

export const agentChatContextSchema = z
  .object({
    userName: z.string().max(120).optional(),
    contextLabel: z.string().max(200).optional(),
    workspaceMode: z.string().max(64).optional(),
    folder: z.string().max(64).optional(),
    timeZone: z.string().max(64).optional(),
    nowLocal: z.string().max(64).optional(),
    todayDate: z.string().max(32).optional(),
    interactiveMode: z.boolean().optional(),
  })
  .optional();

export const agentCalendarIntentSchema = z.object({
  summary: z.string().min(1).max(500),
  date: z.string().min(1).max(32),
  startTime: z.string().min(1).max(16),
  endTime: z.string().min(1).max(16),
  attendees: z.array(z.string().email()).optional(),
  addGoogleMeet: z.boolean().optional(),
  timeZone: z.string().max(64).optional(),
  description: z.string().max(4000).optional(),
});

export const agentConfirmDraftSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1).max(500),
  body: z.string().min(1).max(32_000),
  calendarIntent: agentCalendarIntentSchema.optional(),
  threadId: uuidSchema.nullable().optional(),
  context: agentChatContextSchema.optional(),
});

export const agentChatSchema = z.object({
  message: z.string().trim().min(1, 'Message is required').max(32_000),
  threadId: uuidSchema.nullable().optional(),
  context: agentChatContextSchema,
});

export const agentThreadCreateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
});

export const agentThreadPatchSchema = z.object({
  title: z.string().trim().min(1).max(200),
});
