import { db } from '@/lib/db';
import { workspaces, userPreferences } from '@/lib/db/schema/app';
import { and, asc, eq } from 'drizzle-orm';
import { getConnectedPluginIds } from '@/lib/plugins/integrations';
import { resolveWorkspaceLayout } from '@/lib/plugins/layout';
import {
  generateWorkspaceName,
  getPlugin,
  MAX_PLUGINS_PER_WORKSPACE,
  workspacePluginIds,
} from '@/lib/plugins/registry';
import type { PluginId, WorkspaceRecord } from '@/lib/plugins/types';

export type CreateWorkspaceInput = {
  name?: string;
  primaryPluginId: PluginId;
  sidebarPluginId?: PluginId | null;
  sortOrder?: number;
};

export type UpdateWorkspaceInput = Partial<CreateWorkspaceInput>;

function toWorkspaceRecord(row: typeof workspaces.$inferSelect): WorkspaceRecord {
  const pluginIds = workspacePluginIds(row.primaryPluginId, row.sidebarPluginId);
  return {
    id: row.id,
    name: row.name,
    primaryPluginId: row.primaryPluginId,
    sidebarPluginId: row.sidebarPluginId,
    pluginIds,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function validateWorkspacePlugins(
  primary: PluginId,
  sidebar: PluginId | null | undefined,
  connected: PluginId[]
): { primary: PluginId; sidebar: PluginId | null } {
  if (!getPlugin(primary)) throw new Error('Invalid primary plugin');
  if (!connected.includes(primary)) {
    throw new Error('Primary plugin is not connected');
  }

  if (!sidebar) return { primary, sidebar: null };

  if (sidebar === primary) throw new Error('Sidebar must differ from primary');
  if (!getPlugin(sidebar)) throw new Error('Invalid sidebar plugin');
  if (!connected.includes(sidebar)) {
    throw new Error('Sidebar plugin is not connected');
  }

  const ids = workspacePluginIds(primary, sidebar);
  if (ids.length > MAX_PLUGINS_PER_WORKSPACE) {
    throw new Error(`A workspace can have at most ${MAX_PLUGINS_PER_WORKSPACE} plugins`);
  }

  return { primary, sidebar };
}

export async function listWorkspacesForUser(userId: string): Promise<WorkspaceRecord[]> {
  const rows = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.userId, userId))
    .orderBy(asc(workspaces.sortOrder), asc(workspaces.createdAt));

  return rows.map(toWorkspaceRecord);
}

export async function getWorkspaceForUser(userId: string, workspaceId: string) {
  const [row] = await db
    .select()
    .from(workspaces)
    .where(and(eq(workspaces.id, workspaceId), eq(workspaces.userId, userId)))
    .limit(1);

  return row ? toWorkspaceRecord(row) : null;
}

export async function getActiveWorkspaceId(userId: string): Promise<string | null> {
  const [prefs] = await db
    .select({ activeWorkspaceId: userPreferences.activeWorkspaceId })
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  return prefs?.activeWorkspaceId ?? null;
}

export async function setActiveWorkspace(userId: string, workspaceId: string) {
  const workspace = await getWorkspaceForUser(userId, workspaceId);
  if (!workspace) throw new Error('Workspace not found');

  await db
    .insert(userPreferences)
    .values({
      userId,
      activeWorkspaceId: workspaceId,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { activeWorkspaceId: workspaceId, updatedAt: new Date() },
    });

  return workspace;
}

export async function createWorkspace(userId: string, input: CreateWorkspaceInput) {
  const connected = await getConnectedPluginIds(userId);
  const { primary, sidebar } = validateWorkspacePlugins(
    input.primaryPluginId,
    input.sidebarPluginId ?? null,
    connected
  );

  const pluginIds = workspacePluginIds(primary, sidebar);
  const name = input.name?.trim() || generateWorkspaceName(pluginIds);

  const existing = await listWorkspacesForUser(userId);
  const sortOrder = input.sortOrder ?? existing.length;

  await releasePluginsFromOtherWorkspaces(userId, '', pluginIds);

  const [row] = await db
    .insert(workspaces)
    .values({
      userId,
      name,
      primaryPluginId: primary,
      sidebarPluginId: sidebar,
      sortOrder,
    })
    .returning();

  if (existing.length === 0) {
    await setActiveWorkspace(userId, row.id);
  }

  return toWorkspaceRecord(row);
}

export async function updateWorkspace(
  userId: string,
  workspaceId: string,
  input: UpdateWorkspaceInput
) {
  const existing = await getWorkspaceForUser(userId, workspaceId);
  if (!existing) throw new Error('Workspace not found');

  const connected = await getConnectedPluginIds(userId);
  const primary = input.primaryPluginId ?? existing.primaryPluginId;
  const sidebar =
    input.sidebarPluginId !== undefined
      ? input.sidebarPluginId
      : existing.sidebarPluginId;

  const requestedIds = workspacePluginIds(primary, sidebar).filter((id) =>
    connected.includes(id)
  );
  const scopedPlugins =
    requestedIds.length > 0
      ? requestedIds
      : existing.pluginIds.filter((id) => connected.includes(id));
  const layout = resolveWorkspaceLayout(
    scopedPlugins.length > 0 ? scopedPlugins : connected,
    { primaryPluginId: primary, sidebarPluginId: sidebar }
  );

  const validated = validateWorkspacePlugins(
    layout.primary,
    layout.sidebar,
    connected
  );
  const pluginIds = workspacePluginIds(validated.primary, validated.sidebar);

  const pluginsChanged =
    input.primaryPluginId !== undefined || input.sidebarPluginId !== undefined;

  if (pluginsChanged) {
    await releasePluginsFromOtherWorkspaces(userId, workspaceId, pluginIds);
  }

  const [row] = await db
    .update(workspaces)
    .set({
      name: input.name?.trim() || generateWorkspaceName(pluginIds),
      primaryPluginId: validated.primary,
      sidebarPluginId: validated.sidebar,
      updatedAt: new Date(),
    })
    .where(and(eq(workspaces.id, workspaceId), eq(workspaces.userId, userId)))
    .returning();

  if (!row) throw new Error('Workspace not found');
  return toWorkspaceRecord(row);
}

/** Remove claimed plugins from other workspaces when user reassigns manually. */
async function releasePluginsFromOtherWorkspaces(
  userId: string,
  excludeWorkspaceId: string,
  claimed: PluginId[]
) {
  if (claimed.length === 0) return;

  let all = await listWorkspacesForUser(userId);

  for (const ws of all) {
    if (ws.id === excludeWorkspaceId) continue;

    const remaining = ws.pluginIds.filter((id) => !claimed.includes(id));
    if (remaining.length === ws.pluginIds.length) continue;

    if (remaining.length === 0) {
      if (all.length > 1) {
        await deleteWorkspace(userId, ws.id);
        all = await listWorkspacesForUser(userId);
      }
      continue;
    }

    await db
      .update(workspaces)
      .set({
        primaryPluginId: remaining[0],
        sidebarPluginId: remaining[1] ?? null,
        name: generateWorkspaceName(remaining),
        updatedAt: new Date(),
      })
      .where(and(eq(workspaces.id, ws.id), eq(workspaces.userId, userId)));
  }
}

export async function deleteWorkspace(userId: string, workspaceId: string) {
  const all = await listWorkspacesForUser(userId);
  if (all.length <= 1) throw new Error('Cannot delete your only workspace');

  const activeId = await getActiveWorkspaceId(userId);
  const result = await db
    .delete(workspaces)
    .where(and(eq(workspaces.id, workspaceId), eq(workspaces.userId, userId)))
    .returning({ id: workspaces.id });

  if (result.length === 0) throw new Error('Workspace not found');

  if (activeId === workspaceId) {
    const remaining = await listWorkspacesForUser(userId);
    if (remaining[0]) await setActiveWorkspace(userId, remaining[0].id);
  }

  return true;
}

/** Drop disconnected plugins from workspace rows and redistribute connected ones. */
export async function reconcileWorkspacesWithConnectedPlugins(
  userId: string
): Promise<WorkspaceRecord[]> {
  const connected = await getConnectedPluginIds(userId);
  const connectedSet = new Set(connected);
  let all = await listWorkspacesForUser(userId);
  let changed = false;

  for (const ws of [...all]) {
    const remaining = ws.pluginIds.filter((id) => connectedSet.has(id));
    if (remaining.length === ws.pluginIds.length) continue;
    changed = true;

    if (remaining.length === 0) {
      if (all.length > 1) {
        await deleteWorkspace(userId, ws.id);
        all = await listWorkspacesForUser(userId);
      } else if (connected.length > 0) {
        const next = connected.slice(0, MAX_PLUGINS_PER_WORKSPACE);
        await db
          .update(workspaces)
          .set({
            primaryPluginId: next[0],
            sidebarPluginId: next[1] ?? null,
            name: generateWorkspaceName(next),
            updatedAt: new Date(),
          })
          .where(and(eq(workspaces.id, ws.id), eq(workspaces.userId, userId)));
      }
      continue;
    }

    await db
      .update(workspaces)
      .set({
        primaryPluginId: remaining[0],
        sidebarPluginId: remaining[1] ?? null,
        name: generateWorkspaceName(remaining),
        updatedAt: new Date(),
      })
      .where(and(eq(workspaces.id, ws.id), eq(workspaces.userId, userId)));
  }

  return changed ? syncWorkspacesFromPlugins(userId) : all;
}

/** Remove a disconnected plugin from every workspace and promote remaining plugins. */
export async function removePluginFromWorkspaces(
  userId: string,
  _pluginId: PluginId
): Promise<WorkspaceRecord[]> {
  return reconcileWorkspacesWithConnectedPlugins(userId);
}

/** Assign each connected plugin to a workspace (max 2 per workspace). */
export async function syncWorkspacesFromPlugins(userId: string): Promise<WorkspaceRecord[]> {
  const connected = await getConnectedPluginIds(userId);
  if (connected.length === 0) return listWorkspacesForUser(userId);

  let all = await listWorkspacesForUser(userId);
  const assigned = new Set<PluginId>();
  for (const ws of all) {
    for (const id of ws.pluginIds) {
      if (connected.includes(id)) assigned.add(id);
    }
  }

  const unassigned = connected.filter((id) => !assigned.has(id));

  for (const pluginId of unassigned) {
    const withRoom = all.find(
      (ws) => ws.pluginIds.length < MAX_PLUGINS_PER_WORKSPACE
    );

    if (withRoom && withRoom.pluginIds.length === 1) {
      const updated = await updateWorkspace(userId, withRoom.id, {
        sidebarPluginId: pluginId,
        name: generateWorkspaceName([withRoom.primaryPluginId, pluginId]),
      });
      all = all.map((w) => (w.id === updated.id ? updated : w));
    } else if (!withRoom) {
      const ws = await createWorkspace(userId, {
        primaryPluginId: pluginId,
        sortOrder: all.length,
      });
      all = [...all, ws];
    }
  }

  return all;
}

/** Create workspace rows from connected plugins (pairs of up to 2). */
export async function ensureDefaultWorkspaces(userId: string) {
  return syncWorkspacesFromPlugins(userId);
}

export async function getWorkspaceContext(userId: string) {
  await reconcileWorkspacesWithConnectedPlugins(userId);
  await ensureDefaultWorkspaces(userId);

  const all = await listWorkspacesForUser(userId);
  const connected = await getConnectedPluginIds(userId);
  let activeId = await getActiveWorkspaceId(userId);

  if (!activeId && all[0]) {
    await setActiveWorkspace(userId, all[0].id);
    activeId = all[0].id;
  }

  const active = all.find((w) => w.id === activeId) ?? all[0] ?? null;

  const activePlugins = active
    ? active.pluginIds.filter((id) => connected.includes(id))
    : [];

  const layout = active
    ? resolveWorkspaceLayout(activePlugins, {
        primaryPluginId: active.primaryPluginId,
        sidebarPluginId: active.sidebarPluginId,
      })
    : { primary: 'email' as PluginId, sidebar: null };

  return {
    workspaces: all,
    activeWorkspace: active,
    activeWorkspaceId: active?.id ?? null,
    connectedPlugins: connected,
    activePlugins,
    layout,
  };
}
