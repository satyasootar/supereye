import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserPreferencesWithContext, upsertUserPreferences } from '@/lib/user/preferences';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await getUserPreferencesWithContext(session.user.id);
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const patch: {
    onboardingCompleted?: boolean;
    activeWorkspaceId?: string | null;
  } = {};

  if (typeof body.onboardingCompleted === 'boolean') {
    patch.onboardingCompleted = body.onboardingCompleted;
  }

  if (body.activeWorkspaceId === null || typeof body.activeWorkspaceId === 'string') {
    patch.activeWorkspaceId = body.activeWorkspaceId;
  }

  const data = await upsertUserPreferences(session.user.id, patch);
  return NextResponse.json(data);
}
