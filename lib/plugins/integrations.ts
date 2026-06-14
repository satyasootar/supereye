import { db } from '@/lib/db';
import { corsairAccounts, corsairIntegrations } from '@/lib/db/schema/corsair';
import { eq } from 'drizzle-orm';
import {
  getPluginByCorsairName,
  PLUGIN_REGISTRY,
} from '@/lib/plugins/registry';
import type { ActivePluginStatus, PluginId } from '@/lib/plugins/types';

export async function getConnectedPluginIds(userId: string): Promise<PluginId[]> {
  const linked = await db
    .select({ integrationName: corsairIntegrations.name })
    .from(corsairAccounts)
    .innerJoin(
      corsairIntegrations,
      eq(corsairAccounts.integrationId, corsairIntegrations.id)
    )
    .where(eq(corsairAccounts.tenantId, userId));

  const connected = new Set<PluginId>();

  for (const row of linked) {
    const plugin = getPluginByCorsairName(row.integrationName);
    if (plugin) connected.add(plugin.id);
  }

  return PLUGIN_REGISTRY.filter((p) => connected.has(p.id)).map((p) => p.id);
}

export async function getActivePluginStatuses(
  userId: string
): Promise<ActivePluginStatus[]> {
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

  return PLUGIN_REGISTRY.map((plugin) => ({
    id: plugin.id,
    label: plugin.label,
    connected: connectedAt.has(plugin.id),
    connectedAt: connectedAt.get(plugin.id) ?? null,
  }));
}
