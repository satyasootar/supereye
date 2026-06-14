import { db } from '@/lib/db';
import { userPreferences } from '@/lib/db/schema/app';
import { eq } from 'drizzle-orm';
import {
  getWorkspaceContext,
  setActiveWorkspace,
  syncWorkspacesFromPlugins,
} from '@/lib/workspaces/workspaces';
import type { UserWorkspacePreferences } from '@/lib/plugins/types';

export async function getUserPreferences(
  userId: string
): Promise<UserWorkspacePreferences> {
  const [row] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  if (!row) {
    return {
      onboardingCompleted: false,
      activeWorkspaceId: null,
    };
  }

  return {
    onboardingCompleted: row.onboardingCompleted,
    activeWorkspaceId: row.activeWorkspaceId,
  };
}

export async function getUserPreferencesWithContext(userId: string) {
  const prefs = await getUserPreferences(userId);
  const context = await getWorkspaceContext(userId);

  return {
    ...prefs,
    ...context,
  };
}

export async function upsertUserPreferences(
  userId: string,
  patch: Partial<UserWorkspacePreferences>
) {
  const existing = await getUserPreferences(userId);
  const merged = { ...existing, ...patch };

  if (merged.activeWorkspaceId) {
    await setActiveWorkspace(userId, merged.activeWorkspaceId);
  }

  if (merged.onboardingCompleted && patch.onboardingCompleted) {
    await syncWorkspacesFromPlugins(userId);
  }

  await db
    .insert(userPreferences)
    .values({
      userId,
      onboardingCompleted: merged.onboardingCompleted,
      activeWorkspaceId: merged.activeWorkspaceId,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: {
        onboardingCompleted: merged.onboardingCompleted,
        activeWorkspaceId: merged.activeWorkspaceId,
        updatedAt: new Date(),
      },
    });

  return getUserPreferencesWithContext(userId);
}

export async function completeOnboarding(userId: string) {
  return upsertUserPreferences(userId, { onboardingCompleted: true });
}
