import { z } from 'zod';
import { pluginIdSchema } from './common';

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  primaryPluginId: pluginIdSchema,
  sidebarPluginId: z.union([pluginIdSchema, z.null()]).optional(),
});

export const updateWorkspaceSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    primaryPluginId: pluginIdSchema.optional(),
    sidebarPluginId: z.union([pluginIdSchema, z.null()]).optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: 'At least one field is required',
  });
