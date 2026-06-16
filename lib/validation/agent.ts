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
  })
  .optional();

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
