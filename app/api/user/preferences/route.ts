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
    botSettings?: {
      showTips?: boolean;
      autoCloseTips?: boolean;
      autoCloseDelay?: number;
    };
  } = {};

  if (typeof body.onboardingCompleted === 'boolean') {
    patch.onboardingCompleted = body.onboardingCompleted;
  }

  if (body.activeWorkspaceId === null || typeof body.activeWorkspaceId === 'string') {
    patch.activeWorkspaceId = body.activeWorkspaceId;
  }

  if (body.botSettings && typeof body.botSettings === 'object') {
    patch.botSettings = {};
    if (typeof body.botSettings.showTips === 'boolean') {
      patch.botSettings.showTips = body.botSettings.showTips;
    }
    if (typeof body.botSettings.autoCloseTips === 'boolean') {
      patch.botSettings.autoCloseTips = body.botSettings.autoCloseTips;
    }
    if (typeof body.botSettings.autoCloseDelay === 'number' && body.botSettings.autoCloseDelay > 0) {
      patch.botSettings.autoCloseDelay = body.botSettings.autoCloseDelay;
    }
  }

  const data = await upsertUserPreferences(session.user.id, patch as Parameters<typeof upsertUserPreferences>[1]);
  return NextResponse.json(data);
}
