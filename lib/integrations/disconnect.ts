import { db } from '@/lib/db';
import {
  corsairAccounts,
  corsairEntities,
  corsairEvents,
  corsairIntegrations,
} from '@/lib/db/schema/corsair';
import { and, eq, inArray } from 'drizzle-orm';
import { isValidCorsairPlugin } from '@/lib/plugins/registry';
import { corsairPluginSchema } from '@/lib/validation/common';
import type { z } from 'zod';

type CorsairPlugin = z.infer<typeof corsairPluginSchema>;

export class DisconnectIntegrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DisconnectIntegrationError';
  }
}

export async function disconnectIntegration(
  userId: string,
  corsairPlugin: CorsairPlugin
): Promise<{ disconnected: boolean }> {
  if (!isValidCorsairPlugin(corsairPlugin)) {
    throw new DisconnectIntegrationError('Unknown integration');
  }

  const [integration] = await db
    .select({ id: corsairIntegrations.id })
    .from(corsairIntegrations)
    .where(eq(corsairIntegrations.name, corsairPlugin))
    .limit(1);

  if (!integration) {
    return { disconnected: false };
  }

  await db.transaction(async (tx) => {
    const accounts = await tx
      .select({ id: corsairAccounts.id })
      .from(corsairAccounts)
      .where(
        and(
          eq(corsairAccounts.tenantId, userId),
          eq(corsairAccounts.integrationId, integration.id)
        )
      );

    const accountIds = accounts.map((row) => row.id);
    if (accountIds.length === 0) return;

    await tx
      .delete(corsairEntities)
      .where(inArray(corsairEntities.accountId, accountIds));
    await tx
      .delete(corsairEvents)
      .where(inArray(corsairEvents.accountId, accountIds));
    await tx
      .delete(corsairAccounts)
      .where(inArray(corsairAccounts.id, accountIds));
  });

  return { disconnected: true };
}
