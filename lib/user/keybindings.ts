import { db } from '@/lib/db';
import { userKeybindings } from '@/lib/db/schema/app';
import { eq } from 'drizzle-orm';
import type { UserKeyOverrides } from '@/lib/keyboard/types';
import { parseUserKeyOverrides } from '@/lib/keyboard/validate-overrides';

export async function getUserKeybindings(userId: string): Promise<UserKeyOverrides> {
  const [row] = await db
    .select()
    .from(userKeybindings)
    .where(eq(userKeybindings.userId, userId))
    .limit(1);

  if (!row) return {};
  return parseUserKeyOverrides(row.overrides);
}

export async function upsertUserKeybindings(
  userId: string,
  overrides: UserKeyOverrides
): Promise<UserKeyOverrides> {
  const sanitized = parseUserKeyOverrides(overrides);

  await db
    .insert(userKeybindings)
    .values({
      userId,
      overrides: sanitized,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userKeybindings.userId,
      set: {
        overrides: sanitized,
        updatedAt: new Date(),
      },
    });

  return sanitized;
}

export async function mergeUserKeybindings(
  userId: string,
  patch: UserKeyOverrides
): Promise<UserKeyOverrides> {
  const existing = await getUserKeybindings(userId);
  const merged = { ...existing, ...parseUserKeyOverrides(patch) };
  return upsertUserKeybindings(userId, merged);
}

export async function removeUserKeybinding(
  userId: string,
  bindingId: string
): Promise<UserKeyOverrides> {
  const existing = await getUserKeybindings(userId);
  const next = { ...existing };
  delete next[bindingId];
  return upsertUserKeybindings(userId, next);
}
