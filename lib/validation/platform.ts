import { z } from 'zod';

export const platformSettingsPatchSchema = z.object({
  demoLoginEnabled: z.boolean(),
});
