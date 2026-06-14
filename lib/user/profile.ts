import { db } from '@/lib/db';
import { users, accounts } from '@/lib/db/schema/auth';
import { corsairAccounts, corsairIntegrations } from '@/lib/db/schema/corsair';
import { eq } from 'drizzle-orm';
import { PLUGIN_REGISTRY, getPluginByCorsairName } from '@/lib/plugins/registry';
import type { PluginId } from '@/lib/plugins/types';

export type IntegrationStatus = {
  id: PluginId;
  corsairPlugin: string;
  label: string;
  connected: boolean;
  connectedAt: string | null;
};

export type UserProfile = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: string;
  authProvider: string;
  integrations: IntegrationStatus[];
};

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  const [authAccount] = await db
    .select({ provider: accounts.provider })
    .from(accounts)
    .where(eq(accounts.userId, userId))
    .limit(1);

  const linked = await db
    .select({
      integrationName: corsairIntegrations.name,
      updatedAt: corsairAccounts.updatedAt,
    })
    .from(corsairAccounts)
    .innerJoin(
      corsairIntegrations,
      eq(corsairAccounts.integrationId, corsairIntegrations.id)
    )
    .where(eq(corsairAccounts.tenantId, userId));

  const connectedAt = new Map<PluginId, string>();

  for (const row of linked) {
    const plugin = getPluginByCorsairName(row.integrationName);
    if (!plugin) continue;
    connectedAt.set(plugin.id, row.updatedAt.toISOString());
  }

  const integrations: IntegrationStatus[] = PLUGIN_REGISTRY.map((plugin) => ({
    id: plugin.id,
    corsairPlugin: plugin.corsairPlugin,
    label: plugin.label,
    connected: connectedAt.has(plugin.id),
    connectedAt: connectedAt.get(plugin.id) ?? null,
  }));

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    createdAt: user.createdAt.toISOString(),
    authProvider: authAccount?.provider ?? 'google',
    integrations,
  };
}
