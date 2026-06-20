import { z } from 'zod';
import { uuidSchema } from './common';

export const billingTopUpSchema = z.object({
  packId: uuidSchema,
});

export const billingSubscriptionRequestSchema = z.object({
  planId: uuidSchema,
  note: z.string().trim().max(500).optional(),
});

export const billingRequestSchema = z.union([
  z.object({
    type: z.literal('credit_top_up'),
    packId: uuidSchema,
    note: z.string().trim().max(500).optional(),
  }),
  z.object({
    type: z.literal('subscription_change'),
    planId: uuidSchema,
    note: z.string().trim().max(500).optional(),
  }),
]);

export const adminBillingRequestActionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  adminNote: z.string().trim().max(500).optional(),
});
