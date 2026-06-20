import { z } from 'zod';
import { paginationQuerySchema, userRoleSchema, uuidSchema } from './common';

export const adminUsersQuerySchema = paginationQuerySchema.extend({
  limit: z.coerce.number().int().min(1).max(100).default(50),
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

export const adminUserUpdateSchema = z.union([
  adminUserActionSchema,
  adminUserPatchSchema,
]);

export const adminTokenPostSchema = z.union([
  z.object({
    action: z.literal('reset'),
    monthlyAllocation: z.number().int().min(0),
  }),
  z.object({
    action: z.enum(['remove', 'bonus', 'adjust', 'add']).optional(),
    amount: z.number().int().positive(),
    reason: z.string().trim().min(1).max(500),
  }),
]);

export const adminEnterpriseCreateSchema = z.object({
  organizationName: z.string().trim().min(1).max(200),
  userId: uuidSchema,
  customPlanId: uuidSchema.optional(),
  customMonthlyTokens: z.number().int().min(0).optional(),
  customFeatureFlags: z.record(z.string(), z.boolean()).optional(),
  customPluginLimit: z.number().int().min(0).nullable().optional(),
  customTeamMemberLimit: z.number().int().min(0).nullable().optional(),
});

export const adminAuditQuerySchema = paginationQuerySchema.extend({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  action: z.string().trim().max(80).optional(),
  search: z.string().trim().max(200).optional(),
});

export const adminBillingQuerySchema = paginationQuerySchema.extend({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().trim().max(200).optional(),
  status: z.enum(['paid', 'pending', 'failed', 'refunded']).optional(),
});

export const adminTokenQuerySchema = z.object({
  type: z.enum(['costs', 'ledger', 'packs']).default('costs'),
  userId: uuidSchema.optional(),
});

const adminTokenCostPatchFields = z.object({
  tokenCost: z.number().int().min(0).optional(),
  displayName: z.string().trim().min(1).max(120).optional(),
  isActive: z.boolean().optional(),
});

const adminTokenPackPatchFields = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  tokenAmount: z.number().int().min(0).optional(),
  priceCents: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const adminTokenPatchSchema = z.union([
  adminTokenPackPatchFields
    .extend({
      type: z.literal('pack'),
      id: uuidSchema,
    })
    .refine((body) => Object.keys(body).length > 2, {
      message: 'At least one pack field is required',
    }),
  adminTokenCostPatchFields
    .extend({
      type: z.literal('cost').optional(),
      id: uuidSchema,
    })
    .refine((body) => Object.keys(body).filter((k) => k !== 'type').length > 1, {
      message: 'At least one cost field is required',
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
    featureFlags: z.record(z.string(), z.boolean()).optional(),
    pluginLimit: z.number().int().min(0).nullable().optional(),
    teamMemberLimit: z.number().int().min(0).nullable().optional(),
  })
  .refine((body) => Object.keys(body).length > 1, {
    message: 'At least one plan field is required',
  });
