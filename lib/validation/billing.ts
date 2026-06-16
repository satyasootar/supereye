import { z } from 'zod';
import { uuidSchema } from './common';

export const billingTopUpSchema = z.object({
  packId: uuidSchema,
});
