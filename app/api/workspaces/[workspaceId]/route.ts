import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import {
  deleteWorkspace,
  getWorkspaceContext,
  getWorkspaceForUser,
  updateWorkspace,
} from '@/lib/workspaces/workspaces';
import { parseJsonBody } from '@/lib/validation/http';
import { updateWorkspaceSchema } from '@/lib/validation/workspace';
import { uuidSchema } from '@/lib/validation/common';

type RouteParams = { params: Promise<{ workspaceId: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const { workspaceId } = await params;
  const idResult = uuidSchema.safeParse(workspaceId);
  if (!idResult.success) {
    return NextResponse.json({ error: 'Invalid workspace id' }, { status: 400 });
  }

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
  const idResult = uuidSchema.safeParse(workspaceId);
  if (!idResult.success) {
    return NextResponse.json({ error: 'Invalid workspace id' }, { status: 400 });
  }

  const parsed = await parseJsonBody(req, updateWorkspaceSchema);
  if ('error' in parsed) return parsed.error;

  try {
    const workspace = await updateWorkspace(session.user.id, workspaceId, parsed.data);
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
