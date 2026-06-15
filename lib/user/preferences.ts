import { db } from '@/lib/db';
import { userPreferences } from '@/lib/db/schema/app';
import { eq } from 'drizzle-orm';
import {
  getWorkspaceContext,
  setActiveWorkspace,
  syncWorkspacesFromPlugins,
} from '@/lib/workspaces/workspaces';
import type { UserWorkspacePreferences, BotSettings } from '@/lib/plugins/types';
import { DEFAULT_BOT_SETTINGS } from '@/lib/plugins/types';

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
      botSettings: DEFAULT_BOT_SETTINGS,
    };
  }

  return {
    onboardingCompleted: row.onboardingCompleted,
    activeWorkspaceId: row.activeWorkspaceId,
    botSettings: (row.botSettings as BotSettings) ?? DEFAULT_BOT_SETTINGS,
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

  // Deep-merge botSettings so partial updates don't wipe other fields
  if (patch.botSettings) {
    merged.botSettings = {
      ...(existing.botSettings ?? DEFAULT_BOT_SETTINGS),
      ...patch.botSettings,
    };
  }

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
      botSettings: merged.botSettings ?? DEFAULT_BOT_SETTINGS,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: {
        onboardingCompleted: merged.onboardingCompleted,
        activeWorkspaceId: merged.activeWorkspaceId,
        botSettings: merged.botSettings ?? DEFAULT_BOT_SETTINGS,
        updatedAt: new Date(),
      },
    });

  return getUserPreferencesWithContext(userId);
}

export async function completeOnboarding(userId: string) {
  return upsertUserPreferences(userId, { onboardingCompleted: true });
}
