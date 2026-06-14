import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createThreadForUser, listThreadsForUser } from '@/lib/agent/threads';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const threads = await listThreadsForUser(session.user.id);
  return NextResponse.json({ threads });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === 'string' ? body.title : undefined;

  const thread = await createThreadForUser(session.user.id, title);

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
