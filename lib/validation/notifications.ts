import { z } from 'zod';
import { paginationQuerySchema, uuidSchema } from './common';

export const notificationsQuerySchema = paginationQuerySchema;

export const notificationReadSchema = z
  .union([
    z.object({ id: uuidSchema }),
    z.object({ markAll: z.literal(true) }),
  ])
  .refine((data) => 'id' in data || data.markAll === true, {
    message: 'Provide id or markAll',
  });
