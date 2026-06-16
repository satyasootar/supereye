import { z } from 'zod';
import { paginationQuerySchema, userRoleSchema, uuidSchema } from './common';

export const adminUsersQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(200).optional(),
});

export const adminUserActionSchema = z.object({
  action: z.enum(['suspend', 'activate']),
});

export const adminUserPatchSchema = z
  .object({
    role: userRoleSchema.optional(),
    name: z.string().trim().min(1).max(120).optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: 'At least one field is required',
  });

export const adminAssignPlanSchema = z.object({
  planId: uuidSchema,
});

export const adminTokenAdjustSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('adjust'),
    amount: z.number().int().refine((n) => n !== 0, 'Amount cannot be zero'),
    reason: z.string().trim().min(1).max(500),
  }),
  z.object({
    action: z.literal('reset'),
    monthlyAllocation: z.number().int().min(0),
  }),
]);

export const adminPlanCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  monthlyTokens: z.number().int().min(0),
  priceCents: z.number().int().min(0).optional(),
  description: z.string().max(500).optional(),
});

export const adminPlanPatchSchema = z
  .object({
    planId: uuidSchema,
    name: z.string().trim().min(1).max(120).optional(),
    monthlyTokens: z.number().int().min(0).optional(),
    priceCents: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((body) => Object.keys(body).length > 1, {
    message: 'At least one plan field is required',
  });
