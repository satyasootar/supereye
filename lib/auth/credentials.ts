import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import {
  hashPassword,
  verifyPassword,
  validatePassword,
} from '@/lib/auth/password';
import { normalizeUserEmail } from '@/lib/auth/normalize-email';

export async function getUserByEmail(email: string) {
  const normalized = normalizeUserEmail(email);
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      image: users.image,
      passwordHash: users.passwordHash,
      status: users.status,
    })
    .from(users)
    .where(sql`lower(${users.email}) = ${normalized}`)
    .orderBy(sql`case when ${users.passwordHash} is not null then 0 else 1 end`)
    .limit(1);

  return user ?? null;
}

export async function authenticateWithPassword(email: string, password: string) {
  const user = await getUserByEmail(email);
  if (!user?.passwordHash) return null;
  if (user.status === 'suspended') return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  return user;
}

export async function userHasPassword(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return !!row?.passwordHash;
}

async function persistUserPassword(
  userId: string,
  newPassword: string
): Promise<{ error?: string }> {
  const passwordHash = await hashPassword(newPassword);

  const [updated] = await db
    .update(users)
    .set({
      passwordHash,
      sessionVersion: sql`coalesce(${users.sessionVersion}, 0) + 1`,
      passwordChangedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({ passwordHash: users.passwordHash });

  if (!updated?.passwordHash) {
    return { error: 'Failed to save password' };
  }

  const verified = await verifyPassword(newPassword, updated.passwordHash);
  if (!verified) {
    return { error: 'Failed to save password' };
  }

  return {};
}

export async function setUserPassword(
  userId: string,
  newPassword: string,
  currentPassword?: string
): Promise<{ error?: string }> {
  const validationError = validatePassword(newPassword);
  if (validationError) return { error: validationError };

  const [user] = await db
    .select({
      email: users.email,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.email) {
    return { error: 'Account email is required before setting a password' };
  }

  if (user.passwordHash) {
    if (!currentPassword) {
      return { error: 'Current password is required' };
    }
    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      return { error: 'Current password is incorrect' };
    }
  }

  return persistUserPassword(userId, newPassword);
}

/** Set password without current password (e.g. after email reset). */
export async function resetUserPassword(
  userId: string,
  newPassword: string
): Promise<{ error?: string }> {
  const validationError = validatePassword(newPassword);
  if (validationError) return { error: validationError };

  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.email) {
    return { error: 'Account not found' };
  }

  return persistUserPassword(userId, newPassword);
}
