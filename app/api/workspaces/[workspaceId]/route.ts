import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import {
  deleteWorkspace,
  getWorkspaceContext,
  getWorkspaceForUser,
  updateWorkspace,
} from '@/lib/workspaces/workspaces';
import { getPlugin, PLUGIN_IDS } from '@/lib/plugins/registry';
import type { PluginId } from '@/lib/plugins/types';

type RouteParams = { params: Promise<{ workspaceId: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const { workspaceId } = await params;
  const workspace = await getWorkspaceForUser(session.user.id, workspaceId);

  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  return NextResponse.json({ workspace });
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const { workspaceId } = await params;
  const body = await req.json();

  const patch: {
    name?: string;
    primaryPluginId?: PluginId;
    sidebarPluginId?: PluginId | null;
  } = {};

  if (typeof body.name === 'string') patch.name = body.name;

  if (typeof body.primaryPluginId === 'string') {
    if (!PLUGIN_IDS.includes(body.primaryPluginId) || !getPlugin(body.primaryPluginId)) {
      return NextResponse.json({ error: 'Invalid primary plugin' }, { status: 400 });
    }
    patch.primaryPluginId = body.primaryPluginId;
  }

  if (body.sidebarPluginId === null || typeof body.sidebarPluginId === 'string') {
    if (
      body.sidebarPluginId !== null &&
      (!PLUGIN_IDS.includes(body.sidebarPluginId) || !getPlugin(body.sidebarPluginId))
    ) {
      return NextResponse.json({ error: 'Invalid sidebar plugin' }, { status: 400 });
    }
    patch.sidebarPluginId = body.sidebarPluginId;
  }

  try {
    const workspace = await updateWorkspace(session.user.id, workspaceId, patch);
    const context = await getWorkspaceContext(session.user.id);
    return NextResponse.json({ workspace, ...context });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Update failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const { workspaceId } = await params;

  try {
    await deleteWorkspace(session.user.id, workspaceId);
    const context = await getWorkspaceContext(session.user.id);
    return NextResponse.json(context);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Delete failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
