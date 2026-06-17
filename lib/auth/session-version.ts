import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

export async function bumpUserSessionVersion(userId: string): Promise<number> {
  const [row] = await db
    .update(users)
    .set({
      sessionVersion: sql`coalesce(${users.sessionVersion}, 0) + 1`,
      passwordChangedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({ sessionVersion: users.sessionVersion });

  return row?.sessionVersion ?? 0;
}

export function isSessionVersionValid(
  tokenVersion: number | undefined,
  dbVersion: number
): boolean {
  if (tokenVersion === undefined) return true;
  return tokenVersion === dbVersion;
}
