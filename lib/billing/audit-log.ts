import { and, desc, eq, ilike, isNotNull, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/lib/db';
import {
  adminAuditLogs,
  plans,
  userActivitySessions,
  userLoginEvents,
  users,
} from '@/lib/db/schema';

const targetUser = alias(users, 'target_user');
const targetPlan = alias(plans, 'target_plan');
const actorUser = alias(users, 'actor_user');

const USER_AUDIT_ACTIONS = ['user_login', 'user_logout', 'session_end'] as const;
export type UserAuditAction = (typeof USER_AUDIT_ACTIONS)[number];

export type AuditLogEntry = {
  log: {
    id: string;
    action: string;
    actorType: 'admin' | 'user';
    targetType: string | null;
    targetId: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
  };
  actorEmail: string | null;
  actorName: string | null;
  targetUserName: string | null;
  targetUserEmail: string | null;
  targetPlanName: string | null;
};

const planTargetJoin = and(
  eq(adminAuditLogs.targetType, 'plan'),
  eq(adminAuditLogs.targetId, sql`${targetPlan.id}::text`)
);

export async function writeAdminAuditLog(params: {
  adminUserId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(adminAuditLogs).values({
    adminUserId: params.adminUserId,
    action: params.action,
    targetType: params.targetType ?? null,
    targetId: params.targetId ?? null,
    metadata: params.metadata ?? null,
  });
}

function matchesActionFilter(action: string | undefined, entryAction: string): boolean {
  if (!action) return true;
  return entryAction === action;
}

function matchesSearchFilter(
  search: string | undefined,
  entry: AuditLogEntry
): boolean {
  if (!search?.trim()) return true;
  const q = search.trim().toLowerCase();
  const haystack = [
    entry.actorEmail,
    entry.actorName,
    entry.targetUserEmail,
    entry.targetUserName,
    entry.targetPlanName,
    entry.log.action,
    entry.log.targetType,
    entry.log.targetId,
    formatMetadataForSearch(entry.log.metadata),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

function formatMetadataForSearch(metadata: Record<string, unknown> | null | undefined): string {
  if (!metadata) return '';
  try {
    return JSON.stringify(metadata);
  } catch {
    return '';
  }
}

function sessionAuditAction(endReason: string | null | undefined): UserAuditAction {
  return endReason === 'sign_out' ? 'user_logout' : 'session_end';
}

async function listAdminAuditEntries(params: {
  action?: string;
  search?: string;
  fetchLimit: number;
}): Promise<AuditLogEntry[]> {
  if (params.action && USER_AUDIT_ACTIONS.includes(params.action as UserAuditAction)) {
    return [];
  }

  const conditions = [];

  if (params.action) {
    conditions.push(eq(adminAuditLogs.action, params.action));
  }

  if (params.search?.trim()) {
    const q = `%${params.search.trim()}%`;
    conditions.push(
      or(
        ilike(users.email, q),
        ilike(users.name, q),
        ilike(adminAuditLogs.action, q),
        ilike(adminAuditLogs.targetId, q),
        ilike(adminAuditLogs.targetType, q),
        ilike(targetUser.email, q),
        ilike(targetUser.name, q),
        ilike(targetPlan.name, q),
        sql`${adminAuditLogs.metadata}::text ILIKE ${q}`
      )
    );
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const rows = await db
    .select({
      log: adminAuditLogs,
      adminEmail: users.email,
      adminName: users.name,
      targetUserName: targetUser.name,
      targetUserEmail: targetUser.email,
      targetPlanName: targetPlan.name,
    })
    .from(adminAuditLogs)
    .innerJoin(users, eq(adminAuditLogs.adminUserId, users.id))
    .leftJoin(
      targetUser,
      and(eq(adminAuditLogs.targetType, 'user'), eq(adminAuditLogs.targetId, targetUser.id))
    )
    .leftJoin(targetPlan, planTargetJoin)
    .where(whereClause)
    .orderBy(desc(adminAuditLogs.createdAt))
    .limit(params.fetchLimit);

  return rows.map((row) => ({
    log: {
      id: row.log.id,
      action: row.log.action,
      actorType: 'admin' as const,
      targetType: row.log.targetType,
      targetId: row.log.targetId,
      metadata: row.log.metadata,
      createdAt: row.log.createdAt.toISOString(),
    },
    actorEmail: row.adminEmail,
    actorName: row.adminName,
    targetUserName: row.targetUserName,
    targetUserEmail: row.targetUserEmail,
    targetPlanName: row.targetPlanName,
  }));
}

async function listUserLoginAuditEntries(params: {
  action?: string;
  search?: string;
  fetchLimit: number;
}): Promise<AuditLogEntry[]> {
  if (params.action && params.action !== 'user_login') {
    return [];
  }

  const conditions = [];

  if (params.search?.trim()) {
    const q = `%${params.search.trim()}%`;
    conditions.push(
      or(
        ilike(actorUser.email, q),
        ilike(actorUser.name, q),
        ilike(userLoginEvents.method, q)
      )
    );
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: userLoginEvents.id,
      userId: userLoginEvents.userId,
      method: userLoginEvents.method,
      loggedInAt: userLoginEvents.loggedInAt,
      actorEmail: actorUser.email,
      actorName: actorUser.name,
    })
    .from(userLoginEvents)
    .innerJoin(actorUser, eq(userLoginEvents.userId, actorUser.id))
    .where(whereClause)
    .orderBy(desc(userLoginEvents.loggedInAt))
    .limit(params.fetchLimit);

  return rows.map((row) => ({
    log: {
      id: `login:${row.id}`,
      action: 'user_login',
      actorType: 'user' as const,
      targetType: 'user',
      targetId: row.userId,
      metadata: { method: row.method },
      createdAt: row.loggedInAt.toISOString(),
    },
    actorEmail: row.actorEmail,
    actorName: row.actorName,
    targetUserName: row.actorName,
    targetUserEmail: row.actorEmail,
    targetPlanName: null,
  }));
}

async function listUserSessionAuditEntries(params: {
  action?: string;
  search?: string;
  fetchLimit: number;
}): Promise<AuditLogEntry[]> {
  if (
    params.action &&
    params.action !== 'session_end' &&
    params.action !== 'user_logout'
  ) {
    return [];
  }

  const conditions = [isNotNull(userActivitySessions.endedAt)];

  if (params.action === 'session_end') {
    conditions.push(
      or(
        eq(userActivitySessions.endReason, 'idle'),
        eq(userActivitySessions.endReason, 'login'),
        eq(userActivitySessions.endReason, 'manual'),
        sql`${userActivitySessions.endReason} IS NULL`
      )!
    );
  } else if (params.action === 'user_logout') {
    conditions.push(eq(userActivitySessions.endReason, 'sign_out'));
  }

  if (params.search?.trim()) {
    const q = `%${params.search.trim()}%`;
    conditions.push(
      or(
        ilike(actorUser.email, q),
        ilike(actorUser.name, q),
        ilike(userActivitySessions.endReason, q)
      )
    );
  }

  const rows = await db
    .select({
      id: userActivitySessions.id,
      userId: userActivitySessions.userId,
      endedAt: userActivitySessions.endedAt,
      durationSeconds: userActivitySessions.durationSeconds,
      endReason: userActivitySessions.endReason,
      actorEmail: actorUser.email,
      actorName: actorUser.name,
    })
    .from(userActivitySessions)
    .innerJoin(actorUser, eq(userActivitySessions.userId, actorUser.id))
    .where(and(...conditions))
    .orderBy(desc(userActivitySessions.endedAt))
    .limit(params.fetchLimit);

  return rows
    .filter((row) => row.endedAt != null)
    .map((row) => {
      const action = sessionAuditAction(row.endReason);
      return {
        log: {
          id: `session:${row.id}`,
          action,
          actorType: 'user' as const,
          targetType: 'user',
          targetId: row.userId,
          metadata: {
            durationSeconds: row.durationSeconds,
            endReason: row.endReason,
          },
          createdAt: row.endedAt!.toISOString(),
        },
        actorEmail: row.actorEmail,
        actorName: row.actorName,
        targetUserName: row.actorName,
        targetUserEmail: row.actorEmail,
        targetPlanName: null,
      };
    });
}

async function countAdminAuditEntries(params: { action?: string; search?: string }) {
  if (params.action && USER_AUDIT_ACTIONS.includes(params.action as UserAuditAction)) {
    return 0;
  }

  const conditions = [];

  if (params.action) {
    conditions.push(eq(adminAuditLogs.action, params.action));
  }

  if (params.search?.trim()) {
    const q = `%${params.search.trim()}%`;
    conditions.push(
      or(
        ilike(users.email, q),
        ilike(users.name, q),
        ilike(adminAuditLogs.action, q),
        ilike(adminAuditLogs.targetId, q),
        ilike(adminAuditLogs.targetType, q),
        ilike(targetUser.email, q),
        ilike(targetUser.name, q),
        ilike(targetPlan.name, q),
        sql`${adminAuditLogs.metadata}::text ILIKE ${q}`
      )
    );
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(adminAuditLogs)
    .innerJoin(users, eq(adminAuditLogs.adminUserId, users.id))
    .leftJoin(
      targetUser,
      and(eq(adminAuditLogs.targetType, 'user'), eq(adminAuditLogs.targetId, targetUser.id))
    )
    .leftJoin(targetPlan, planTargetJoin)
    .where(whereClause);

  return row?.total ?? 0;
}

async function countUserLoginAuditEntries(params: { action?: string; search?: string }) {
  if (params.action && params.action !== 'user_login') return 0;

  const conditions = [];

  if (params.search?.trim()) {
    const q = `%${params.search.trim()}%`;
    conditions.push(
      or(
        ilike(actorUser.email, q),
        ilike(actorUser.name, q),
        ilike(userLoginEvents.method, q)
      )
    );
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(userLoginEvents)
    .innerJoin(actorUser, eq(userLoginEvents.userId, actorUser.id))
    .where(whereClause);

  return row?.total ?? 0;
}

async function countUserSessionAuditEntries(params: { action?: string; search?: string }) {
  if (
    params.action &&
    params.action !== 'session_end' &&
    params.action !== 'user_logout'
  ) {
    return 0;
  }

  const conditions = [isNotNull(userActivitySessions.endedAt)];

  if (params.action === 'session_end') {
    conditions.push(
      or(
        eq(userActivitySessions.endReason, 'idle'),
        eq(userActivitySessions.endReason, 'login'),
        eq(userActivitySessions.endReason, 'manual'),
        sql`${userActivitySessions.endReason} IS NULL`
      )!
    );
  } else if (params.action === 'user_logout') {
    conditions.push(eq(userActivitySessions.endReason, 'sign_out'));
  }

  if (params.search?.trim()) {
    const q = `%${params.search.trim()}%`;
    conditions.push(
      or(
        ilike(actorUser.email, q),
        ilike(actorUser.name, q),
        ilike(userActivitySessions.endReason, q)
      )
    );
  }

  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(userActivitySessions)
    .innerJoin(actorUser, eq(userActivitySessions.userId, actorUser.id))
    .where(and(...conditions));

  return row?.total ?? 0;
}

export async function listAuditLogs(params: {
  limit?: number;
  offset?: number;
  action?: string;
  search?: string;
}) {
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;
  const fetchLimit = offset + limit;

  const [adminEntries, loginEntries, sessionEntries, adminTotal, loginTotal, sessionTotal] =
    await Promise.all([
      listAdminAuditEntries({ ...params, fetchLimit }),
      listUserLoginAuditEntries({ ...params, fetchLimit }),
      listUserSessionAuditEntries({ ...params, fetchLimit }),
      countAdminAuditEntries(params),
      countUserLoginAuditEntries(params),
      countUserSessionAuditEntries(params),
    ]);

  const merged = [...adminEntries, ...loginEntries, ...sessionEntries]
    .filter(
      (entry) =>
        matchesActionFilter(params.action, entry.log.action) &&
        matchesSearchFilter(params.search, entry)
    )
    .sort(
      (a, b) => Date.parse(b.log.createdAt) - Date.parse(a.log.createdAt)
    );

  return {
    logs: merged.slice(offset, offset + limit),
    total: adminTotal + loginTotal + sessionTotal,
  };
}

export async function listAuditActions(): Promise<string[]> {
  const [adminRows] = await Promise.all([
    db
      .selectDistinct({ action: adminAuditLogs.action })
      .from(adminAuditLogs)
      .orderBy(adminAuditLogs.action),
  ]);

  const actions = new Set<string>([
    ...adminRows.map((row) => row.action),
    ...USER_AUDIT_ACTIONS,
  ]);

  return [...actions].sort();
}
