import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import {
  SUPER_ADMIN_EMAILS,
  type UserRole,
  hasAdminPanelAccess,
  hasSuperAdminRole,
} from './constants';

export { hasAdminPanelAccess, hasSuperAdminRole, hasUnlimitedAiAccess } from './constants';

export class AuthorizationError extends Error {
  status = 403;
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email || SUPER_ADMIN_EMAILS.length === 0) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
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

/** Admin panel access — super_admin or admin */
export async function requireAdminPanel(userId: string) {
  const user = await requireActiveUser(userId);
  if (!hasAdminPanelAccess(user.role)) {
    throw new AuthorizationError('Admin access required');
  }
  return user;
}

/** Super admin only — token increases, role promotion to admin, plan changes */
export async function requireSuperAdmin(userId: string) {
  const user = await requireActiveUser(userId);
  if (!hasSuperAdminRole(user.role)) {
    throw new AuthorizationError('Super admin access required');
  }
  return user;
}

/** @deprecated Use requireAdminPanel */
export async function requireAdmin(userId: string) {
  return requireAdminPanel(userId);
}

export function assertCanModifyTargetUser(params: {
  actorRole: UserRole;
  targetRole: UserRole;
}) {
  const { actorRole, targetRole } = params;

  if (targetRole === 'super_admin' && !hasSuperAdminRole(actorRole)) {
    throw new AuthorizationError('Cannot modify super admin accounts');
  }

  if (targetRole === 'admin' && !hasSuperAdminRole(actorRole)) {
    throw new AuthorizationError('Only super admins can modify admin accounts');
  }
}

export function assertCanAssignRole(params: {
  actorRole: UserRole;
  newRole: UserRole;
}) {
  const { actorRole, newRole } = params;

  if (newRole === 'super_admin') {
    throw new AuthorizationError('Super admin role can only be assigned via environment config');
  }

  if (newRole === 'admin' && !hasSuperAdminRole(actorRole)) {
    throw new AuthorizationError('Only super admins can promote users to admin');
  }
}

export async function touchUserActivity(userId: string) {
  await db
    .update(users)
    .set({ lastActiveAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId));
}
