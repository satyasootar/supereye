import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import {
  createWorkspace,
  getWorkspaceContext,
} from '@/lib/workspaces/workspaces';
import { parseJsonBody } from '@/lib/validation/http';
import { createWorkspaceSchema } from '@/lib/validation/workspace';

export async function GET() {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const context = await getWorkspaceContext(session.user.id);
  return NextResponse.json(context);
}

export async function POST(req: Request) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const parsed = await parseJsonBody(req, createWorkspaceSchema);
  if ('error' in parsed) return parsed.error;

  try {
    const workspace = await createWorkspace(session.user.id, {
      name: parsed.data.name,
      primaryPluginId: parsed.data.primaryPluginId,
      sidebarPluginId: parsed.data.sidebarPluginId ?? null,
    });

    const context = await getWorkspaceContext(session.user.id);
    return NextResponse.json({ workspace, ...context });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to create workspace';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
