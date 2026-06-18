import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/lib/db';
import { adminAuditLogs, plans, users } from '@/lib/db/schema';

const targetUser = alias(users, 'target_user');
const targetPlan = alias(plans, 'target_plan');

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

function buildAuditConditions(params: { action?: string; search?: string }) {
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

  return conditions;
}

export async function listAuditLogs(params: {
  limit?: number;
  offset?: number;
  action?: string;
  search?: string;
}) {
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;
  const conditions = buildAuditConditions(params);
  const whereClause = conditions.length ? and(...conditions) : undefined;

  const baseQuery = db
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
    .leftJoin(
      targetPlan,
      planTargetJoin
    )
    .where(whereClause);

  const [rows, [totalRow]] = await Promise.all([
    baseQuery.orderBy(desc(adminAuditLogs.createdAt)).limit(limit).offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(adminAuditLogs)
      .innerJoin(users, eq(adminAuditLogs.adminUserId, users.id))
      .leftJoin(
        targetUser,
        and(eq(adminAuditLogs.targetType, 'user'), eq(adminAuditLogs.targetId, targetUser.id))
      )
      .leftJoin(
        targetPlan,
        planTargetJoin
      )
      .where(whereClause),
  ]);

  return {
    logs: rows.map((row) => ({
      ...row,
      log: {
        ...row.log,
        createdAt: row.log.createdAt.toISOString(),
      },
    })),
    total: totalRow?.total ?? 0,
  };
}

export async function listAuditActions(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ action: adminAuditLogs.action })
    .from(adminAuditLogs)
    .orderBy(adminAuditLogs.action);

  return rows.map((row) => row.action);
}
