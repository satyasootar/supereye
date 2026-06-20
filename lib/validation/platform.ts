import { z } from 'zod';
import { uuidSchema } from './common';

export const platformSettingsPatchSchema = z
  .object({
    demoLoginEnabled: z.boolean().optional(),
    defaultSignupPlanId: uuidSchema.nullable().optional(),
  })
  .refine(
    (body) => body.demoLoginEnabled !== undefined || body.defaultSignupPlanId !== undefined,
    { message: 'At least one setting is required' }
  );
