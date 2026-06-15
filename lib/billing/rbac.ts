import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { SUPER_ADMIN_EMAIL, type UserRole } from './constants';

export class AuthorizationError extends Error {
  status = 403;
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!SUPER_ADMIN_EMAIL) return false;
  return email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

export async function getUserRole(userId: string): Promise<UserRole> {
  const [row] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return (row?.role as UserRole) ?? 'user';
}

export async function getUserAccess(userId: string) {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      status: users.status,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) return null;
  return row;
}

export async function requireActiveUser(userId: string) {
  const user = await getUserAccess(userId);
  if (!user) throw new AuthorizationError('User not found');
  if (user.status === 'suspended') throw new AuthorizationError('Account suspended');
  return user;
}

export async function requireAdmin(userId: string) {
  const user = await requireActiveUser(userId);
  if (user.role !== 'super_admin') {
    throw new AuthorizationError('Admin access required');
  }
  return user;
}

export function hasAdminRole(role: string | null | undefined): boolean {
  return role === 'super_admin';
}

export async function touchUserActivity(userId: string) {
  await db
    .update(users)
    .set({ lastActiveAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId));
}
