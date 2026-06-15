import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import {
  deleteThreadForUser,
  getThreadWithMessages,
  renameThreadForUser,
} from '@/lib/agent/threads';

type RouteParams = { params: Promise<{ threadId: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const { threadId } = await params;
  const data = await getThreadWithMessages(session.user.id, threadId);

  if (!data) {
    return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const { threadId } = await params;
  const body = await req.json();
  const title = typeof body.title === 'string' ? body.title : '';

  try {
    const thread = await renameThreadForUser(session.user.id, threadId, title);
    return NextResponse.json({
      thread: {
        id: thread.id,
        title: thread.title,
        updatedAt: thread.updatedAt.toISOString(),
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Update failed';
    return NextResponse.json({ error: msg }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const { threadId } = await params;

  try {
    await deleteThreadForUser(session.user.id, threadId);
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Delete failed';
    return NextResponse.json({ error: msg }, { status: 404 });
  }
}
