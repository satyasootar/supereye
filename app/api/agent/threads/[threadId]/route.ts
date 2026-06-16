import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import {
  deleteThreadForUser,
  getThreadWithMessages,
  renameThreadForUser,
} from '@/lib/agent/threads';
import { parseJsonBody } from '@/lib/validation/http';
import { agentThreadPatchSchema } from '@/lib/validation/agent';
import { uuidSchema } from '@/lib/validation/common';

type RouteParams = { params: Promise<{ threadId: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const { threadId } = await params;
  if (!uuidSchema.safeParse(threadId).success) {
    return NextResponse.json({ error: 'Invalid thread id' }, { status: 400 });
  }
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
  if (!uuidSchema.safeParse(threadId).success) {
    return NextResponse.json({ error: 'Invalid thread id' }, { status: 400 });
  }

  const parsed = await parseJsonBody(req, agentThreadPatchSchema);
  if ('error' in parsed) return parsed.error;

  try {
    const thread = await renameThreadForUser(
      session.user.id,
      threadId,
      parsed.data.title
    );
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
  if (!uuidSchema.safeParse(threadId).success) {
    return NextResponse.json({ error: 'Invalid thread id' }, { status: 400 });
  }

  try {
    await deleteThreadForUser(session.user.id, threadId);
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Delete failed';
    return NextResponse.json({ error: msg }, { status: 404 });
  }
}
