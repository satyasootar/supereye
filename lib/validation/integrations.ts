import { z } from 'zod';
import { corsairPluginSchema } from './common';

export const integrationsConnectSchema = z.object({
  plugin: corsairPluginSchema,
});
