import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { createThreadForUser, listThreadsForUser } from '@/lib/agent/threads';
import { parseJsonBody, validationErrorResponse } from '@/lib/validation/http';
import { agentThreadCreateSchema } from '@/lib/validation/agent';

export async function GET() {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const threads = await listThreadsForUser(session.user.id);
  return NextResponse.json({ threads });
}

export async function POST(req: Request) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const body = await req.json().catch(() => ({}));
  const parsed = agentThreadCreateSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  const thread = await createThreadForUser(session.user.id, parsed.data.title);

  return NextResponse.json({
    thread: {
      id: thread.id,
      title: thread.title,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
      lastMessageAt: thread.lastMessageAt.toISOString(),
    },
  });
}
