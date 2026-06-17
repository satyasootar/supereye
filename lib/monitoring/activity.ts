import { and, desc, eq, isNull, lt, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  users,
  aiUsageEvents,
  tokenWallets,
  subscriptions,
  plans,
  userActivitySessions,
  userLoginEvents,
} from '@/lib/db/schema';
import {
  isRecentlyOnline,
  SESSION_IDLE_TIMEOUT_MS,
  sessionDurationSeconds,
} from '@/lib/monitoring/format';

function idleCutoff(now = new Date()) {
  return new Date(now.getTime() - SESSION_IDLE_TIMEOUT_MS);
}

async function closeStaleSessionsForUser(userId: string, now = new Date()) {
  const cutoff = idleCutoff(now);
  const openSessions = await db
    .select({
      id: userActivitySessions.id,
      startedAt: userActivitySessions.startedAt,
      lastHeartbeatAt: userActivitySessions.lastHeartbeatAt,
    })
    .from(userActivitySessions)
    .where(
      and(
        eq(userActivitySessions.userId, userId),
        isNull(userActivitySessions.endedAt),
        lt(userActivitySessions.lastHeartbeatAt, cutoff)
      )
    );

  for (const session of openSessions) {
    await finalizeSession(session.id, userId, session.startedAt, session.lastHeartbeatAt, now);
  }
}

async function finalizeSession(
  sessionId: string,
  userId: string,
  startedAt: Date,
  endedReference: Date,
  now = new Date()
) {
  const durationSeconds = sessionDurationSeconds(startedAt, endedReference, endedReference, now.getTime());

  await db
    .update(userActivitySessions)
    .set({
      endedAt: endedReference,
      durationSeconds,
    })
    .where(eq(userActivitySessions.id, sessionId));

  if (durationSeconds > 0) {
    await db
      .update(users)
      .set({
        totalTimeSpentSeconds: sql`coalesce(${users.totalTimeSpentSeconds}, 0) + ${durationSeconds}`,
        updatedAt: now,
      })
      .where(eq(users.id, userId));
  }
}

export async function recordUserLogin(userId: string, method: string) {
  const now = new Date();
  await closeStaleSessionsForUser(userId, now);
  await endActiveUserSession(userId, now);

  await db.insert(userLoginEvents).values({
    userId,
    method,
    loggedInAt: now,
  });

  await db
    .update(users)
    .set({ lastLoginAt: now, updatedAt: now })
    .where(eq(users.id, userId));

  await db.insert(userActivitySessions).values({
    userId,
    startedAt: now,
    lastHeartbeatAt: now,
  });
}

export async function endActiveUserSession(userId: string, now = new Date()) {
  const [active] = await db
    .select({
      id: userActivitySessions.id,
      startedAt: userActivitySessions.startedAt,
      lastHeartbeatAt: userActivitySessions.lastHeartbeatAt,
    })
    .from(userActivitySessions)
    .where(
      and(eq(userActivitySessions.userId, userId), isNull(userActivitySessions.endedAt))
    )
    .orderBy(desc(userActivitySessions.startedAt))
    .limit(1);

  if (!active) return;
  await finalizeSession(active.id, userId, active.startedAt, active.lastHeartbeatAt, now);
}

export async function recordUserHeartbeat(userId: string) {
  const now = new Date();
  await closeStaleSessionsForUser(userId, now);

  const [active] = await db
    .select({ id: userActivitySessions.id })
    .from(userActivitySessions)
    .where(
      and(eq(userActivitySessions.userId, userId), isNull(userActivitySessions.endedAt))
    )
    .orderBy(desc(userActivitySessions.startedAt))
    .limit(1);

  if (active) {
    await db
      .update(userActivitySessions)
      .set({ lastHeartbeatAt: now })
      .where(eq(userActivitySessions.id, active.id));
    return;
  }

  await db.insert(userActivitySessions).values({
    userId,
    startedAt: now,
    lastHeartbeatAt: now,
  });
}

export type AdminUserWithMonitoring = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  status: string;
  createdAt: string;
  lastActiveAt: string | null;
  balance: number | null;
  monthlyAllocation: number | null;
  usedThisPeriod: number | null;
  unlimited: boolean | null;
  planName: string | null;
  planSlug: string | null;
  subscriptionStatus: string | null;
  isOnline: boolean;
  lastLoginAt: string | null;
  lastSeenAt: string | null;
  currentSessionStartedAt: string | null;
  currentSessionSeconds: number;
  totalTimeSpentSeconds: number;
  aiTokensUsed: number;
};

export async function listAdminUsersWithMonitoring(params?: {
  search?: string;
}): Promise<AdminUserWithMonitoring[]> {
  const now = new Date();
  await Promise.all(
    (
      await db
        .select({ userId: userActivitySessions.userId })
        .from(userActivitySessions)
        .where(
          and(
            isNull(userActivitySessions.endedAt),
            lt(userActivitySessions.lastHeartbeatAt, idleCutoff(now))
          )
        )
        .groupBy(userActivitySessions.userId)
    ).map((row) => closeStaleSessionsForUser(row.userId, now))
  );

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
      lastActiveAt: users.lastActiveAt,
      totalTimeSpentSeconds: users.totalTimeSpentSeconds,
      balance: tokenWallets.balance,
      monthlyAllocation: tokenWallets.monthlyAllocation,
      usedThisPeriod: tokenWallets.usedThisPeriod,
      unlimited: tokenWallets.unlimited,
      planName: plans.name,
      planSlug: plans.slug,
      subscriptionStatus: subscriptions.status,
      sessionStartedAt: userActivitySessions.startedAt,
      sessionHeartbeatAt: userActivitySessions.lastHeartbeatAt,
      sessionEndedAt: userActivitySessions.endedAt,
    })
    .from(users)
    .leftJoin(tokenWallets, eq(tokenWallets.userId, users.id))
    .leftJoin(
      subscriptions,
      and(eq(subscriptions.userId, users.id), eq(subscriptions.status, 'active'))
    )
    .leftJoin(plans, eq(subscriptions.planId, plans.id))
    .leftJoin(
      userActivitySessions,
      and(
        eq(userActivitySessions.userId, users.id),
        isNull(userActivitySessions.endedAt)
      )
    )
    .orderBy(desc(users.lastActiveAt));

  const aiUsageByUser = await db
    .select({
      userId: aiUsageEvents.userId,
      total: sql<number>`coalesce(sum(${aiUsageEvents.totalTokens}), 0)::int`,
    })
    .from(aiUsageEvents)
    .groupBy(aiUsageEvents.userId);

  const aiMap = new Map(aiUsageByUser.map((row) => [row.userId, row.total]));

  const seen = new Set<string>();
  let result: AdminUserWithMonitoring[] = [];

  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);

    const online =
      row.sessionEndedAt == null &&
      isRecentlyOnline(row.sessionHeartbeatAt, now.getTime());

    const currentSessionSeconds =
      online && row.sessionStartedAt && row.sessionHeartbeatAt
        ? sessionDurationSeconds(
            row.sessionStartedAt,
            row.sessionHeartbeatAt,
            null,
            now.getTime()
          )
        : 0;

    result.push({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      lastActiveAt: row.lastActiveAt?.toISOString() ?? null,
      balance: row.balance,
      monthlyAllocation: row.monthlyAllocation,
      usedThisPeriod: row.usedThisPeriod,
      unlimited: row.unlimited,
      planName: row.planName,
      planSlug: row.planSlug,
      subscriptionStatus: row.subscriptionStatus,
      isOnline: online,
      lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
      lastSeenAt: (row.sessionHeartbeatAt ?? row.lastActiveAt)?.toISOString() ?? null,
      currentSessionStartedAt:
        online && row.sessionStartedAt ? row.sessionStartedAt.toISOString() : null,
      currentSessionSeconds,
      totalTimeSpentSeconds: (row.totalTimeSpentSeconds ?? 0) + currentSessionSeconds,
      aiTokensUsed: aiMap.get(row.id) ?? 0,
    });
  }

  if (params?.search) {
    const q = params.search.toLowerCase();
    result = result.filter(
      (r) =>
        r.email?.toLowerCase().includes(q) || r.name?.toLowerCase().includes(q)
    );
  }

  result.sort((a, b) => {
    if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
    const aSeen = a.lastSeenAt ? Date.parse(a.lastSeenAt) : 0;
    const bSeen = b.lastSeenAt ? Date.parse(b.lastSeenAt) : 0;
    return bSeen - aSeen;
  });

  return result;
}
