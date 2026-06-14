import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  createWorkspace,
  getWorkspaceContext,
  listWorkspacesForUser,
} from '@/lib/workspaces/workspaces';
import { getPlugin, PLUGIN_IDS } from '@/lib/plugins/registry';
import type { PluginId } from '@/lib/plugins/types';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const context = await getWorkspaceContext(session.user.id);
  return NextResponse.json(context);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const primaryPluginId = body.primaryPluginId as string;
  const sidebarPluginId =
    body.sidebarPluginId === null || body.sidebarPluginId === undefined
      ? null
      : (body.sidebarPluginId as string);

  if (!primaryPluginId || !PLUGIN_IDS.includes(primaryPluginId) || !getPlugin(primaryPluginId)) {
    return NextResponse.json({ error: 'Invalid primary plugin' }, { status: 400 });
  }

  if (
    sidebarPluginId &&
    (!PLUGIN_IDS.includes(sidebarPluginId) || !getPlugin(sidebarPluginId))
  ) {
    return NextResponse.json({ error: 'Invalid sidebar plugin' }, { status: 400 });
  }

  try {
    const workspace = await createWorkspace(session.user.id, {
      name: typeof body.name === 'string' ? body.name : undefined,
      primaryPluginId: primaryPluginId as PluginId,
      sidebarPluginId: sidebarPluginId as PluginId | null,
    });

    const context = await getWorkspaceContext(session.user.id);
    return NextResponse.json({ workspace, ...context });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to create workspace';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
