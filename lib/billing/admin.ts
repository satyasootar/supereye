import { eq, desc, sql, and, gte, count, sum, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  users,
  subscriptions,
  plans,
  tokenWallets,
  tokenLedger,
  invoices,
  aiUsageEvents,
  corsairAccounts,
  corsairIntegrations,
} from '@/lib/db/schema';
import { getPluginByCorsairName, PLUGIN_REGISTRY } from '@/lib/plugins/registry';
import { ANALYTICS_WINDOW_DAYS, fillDailySeries } from './chart-series';
import { resetPeriodTokens, adjustTokens } from './tokens';
import { writeAdminAuditLog } from './audit-log';
import { getDefaultSignupPlanId } from '@/lib/platform/settings';

export async function assignPlanToUser(params: {
  userId: string;
  planId: string;
  adminUserId?: string;
}) {
  const [plan] = await db.select().from(plans).where(eq(plans.id, params.planId)).limit(1);
  if (!plan) throw new Error('Plan not found');

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, params.userId), eq(subscriptions.status, 'active')))
    .limit(1);

  if (existing) {
    await db
      .update(subscriptions)
      .set({
        planId: params.planId,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        updatedAt: now,
      })
      .where(eq(subscriptions.id, existing.id));
  } else {
    await db.insert(subscriptions).values({
      userId: params.userId,
      planId: params.planId,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    });
  }

  const allocation = plan.monthlyTokens ?? 0;
  await resetPeriodTokens(params.userId, allocation);

  if (params.adminUserId) {
    await db.insert(invoices).values({
      invoiceNumber: `INV-${Date.now()}`,
      userId: params.userId,
      planId: params.planId,
      amountCents: plan.priceCents,
      status: plan.isEnterprise ? 'draft' : 'paid',
      paymentMethod: 'admin_assigned',
      issuedAt: now,
      periodStart: now,
      periodEnd,
    });

    await writeAdminAuditLog({
      adminUserId: params.adminUserId,
      action: 'assign_plan',
      targetType: 'user',
      targetId: params.userId,
      metadata: { planId: params.planId, planName: plan.name },
    });
  }

  return plan;
}

export async function getUserSubscription(userId: string) {
  const [row] = await db
    .select({
      subscription: subscriptions,
      plan: plans,
    })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);
  return row ?? null;
}

export async function ensureUserHasSubscription(userId: string) {
  const existing = await getUserSubscription(userId);
  if (existing) return existing;

  const defaultPlanId = await getDefaultSignupPlanId();
  if (!defaultPlanId) return null;

  await assignPlanToUser({ userId, planId: defaultPlanId });
  return getUserSubscription(userId);
}

export async function listUsersForAdmin(params: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
      lastActiveAt: users.lastActiveAt,
      balance: tokenWallets.balance,
      monthlyAllocation: tokenWallets.monthlyAllocation,
      usedThisPeriod: tokenWallets.usedThisPeriod,
      unlimited: tokenWallets.unlimited,
      planName: plans.name,
      planSlug: plans.slug,
      subscriptionStatus: subscriptions.status,
    })
    .from(users)
    .leftJoin(tokenWallets, eq(tokenWallets.userId, users.id))
    .leftJoin(
      subscriptions,
      and(eq(subscriptions.userId, users.id), eq(subscriptions.status, 'active'))
    )
    .leftJoin(plans, eq(subscriptions.planId, plans.id))
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  if (params.search) {
    const q = params.search.toLowerCase();
    return rows.filter(
      (r) =>
        r.email?.toLowerCase().includes(q) ||
        r.name?.toLowerCase().includes(q)
    );
  }

  return rows;
}

export async function getAdminOverviewStats() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [userStats] = await db
    .select({
      totalUsers: count(),
      activeUsers: sql<number>`count(*) filter (where ${users.lastActiveAt} >= ${thirtyDaysAgo})`,
    })
    .from(users);

  const [newUsers] = await db
    .select({ count: count() })
    .from(users)
    .where(gte(users.createdAt, thirtyDaysAgo));

  const [revenue] = await db
    .select({ total: sum(invoices.amountCents) })
    .from(invoices)
    .where(eq(invoices.status, 'paid'));

  const [monthlyRevenue] = await db
    .select({ total: sum(invoices.amountCents) })
    .from(invoices)
    .where(and(eq(invoices.status, 'paid'), gte(invoices.issuedAt, thirtyDaysAgo)));

  const [aiStats] = await db
    .select({
      totalRequests: count(),
      totalTokens: sum(aiUsageEvents.totalTokens),
    })
    .from(aiUsageEvents);

  const [activeSubs] = await db
    .select({ count: count() })
    .from(subscriptions)
    .where(eq(subscriptions.status, 'active'));

  const [expiredSubs] = await db
    .select({ count: count() })
    .from(subscriptions)
    .where(eq(subscriptions.status, 'expired'));

  const [enterpriseCount] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.role, 'enterprise_user'));

  return {
    totalUsers: userStats?.totalUsers ?? 0,
    activeUsers: Number(userStats?.activeUsers ?? 0),
    newUsers: newUsers?.count ?? 0,
    totalRevenueCents: Number(revenue?.total ?? 0),
    monthlyRevenueCents: Number(monthlyRevenue?.total ?? 0),
    totalAiRequests: aiStats?.totalRequests ?? 0,
    totalTokensConsumed: Number(aiStats?.totalTokens ?? 0),
    enterpriseCustomers: enterpriseCount?.count ?? 0,
    activeSubscriptions: activeSubs?.count ?? 0,
    expiredSubscriptions: expiredSubs?.count ?? 0,
  };
}

export async function getPlanAnalytics() {
  const planRows = await db.select().from(plans).where(eq(plans.isActive, true));

  const results = [];
  for (const plan of planRows) {
    const [userCount] = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(and(eq(subscriptions.planId, plan.id), eq(subscriptions.status, 'active')));

    const [revenue] = await db
      .select({ total: sum(invoices.amountCents) })
      .from(invoices)
      .where(and(eq(invoices.planId, plan.id), eq(invoices.status, 'paid')));

    results.push({
      plan,
      userCount: userCount?.count ?? 0,
      revenueCents: Number(revenue?.total ?? 0),
      monthlyTokens: plan.monthlyTokens,
    });
  }
  return results;
}

export async function getPluginAnalytics() {
  const accounts = await db
    .select({
      tenantId: corsairAccounts.tenantId,
      createdAt: corsairAccounts.createdAt,
      integrationName: corsairIntegrations.name,
    })
    .from(corsairAccounts)
    .innerJoin(
      corsairIntegrations,
      eq(corsairAccounts.integrationId, corsairIntegrations.id)
    );

  type PluginBucket = { pluginId: string; label: string; count: number };
  const byPluginMap = new Map<string, PluginBucket>();
  const userPlugins: Record<string, string[]> = {};

  const resolvedAccounts = accounts.map((acc) => {
    const plugin = getPluginByCorsairName(acc.integrationName);
    const pluginId = plugin?.id ?? acc.integrationName;
    const label = plugin?.label ?? acc.integrationName;
    return { ...acc, pluginId, label };
  });

  for (const acc of resolvedAccounts) {
    const existing = byPluginMap.get(acc.pluginId);
    if (existing) {
      existing.count += 1;
    } else {
      byPluginMap.set(acc.pluginId, {
        pluginId: acc.pluginId,
        label: acc.label,
        count: 1,
      });
    }

    if (!userPlugins[acc.tenantId]) userPlugins[acc.tenantId] = [];
    if (!userPlugins[acc.tenantId].includes(acc.label)) {
      userPlugins[acc.tenantId].push(acc.label);
    }
  }

  const byPlugin = PLUGIN_REGISTRY.map((plugin) => ({
    pluginId: plugin.id,
    label: plugin.label,
    count: byPluginMap.get(plugin.id)?.count ?? 0,
  })).sort((a, b) => b.count - a.count);

  const pluginSeries = PLUGIN_REGISTRY.map((plugin) => ({
    key: plugin.id,
    label: plugin.label,
  }));

  const dayKeys = fillDailySeries([], ANALYTICS_WINDOW_DAYS).map((point) => point.day);
  const connectionTrend = dayKeys.map((day) => {
    const dayEnd = new Date(`${day}T23:59:59.999`);
    const row: Record<string, string | number> = { day };

    for (const plugin of PLUGIN_REGISTRY) {
      row[plugin.id] = resolvedAccounts.filter(
        (acc) => acc.pluginId === plugin.id && acc.createdAt <= dayEnd
      ).length;
    }

    return row;
  });

  const tenantIds = Object.keys(userPlugins);
  const userRows =
    tenantIds.length > 0
      ? await db
          .select({ id: users.id, name: users.name, email: users.email })
          .from(users)
          .where(inArray(users.id, tenantIds))
      : [];

  const userLabelById = new Map(
    userRows.map((user) => [
      user.id,
      user.name?.trim() || user.email || 'Unknown user',
    ])
  );

  const userPluginConnections = tenantIds
    .map((tenantId) => {
      const plugins = userPlugins[tenantId];
      return {
        name: userLabelById.get(tenantId) ?? 'Unknown user',
        count: plugins.length,
        plugins,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    totalConnections: accounts.length,
    byPlugin,
    connectionTrend,
    pluginSeries,
    uniqueUsers: tenantIds.length,
    userPluginConnections,
  };
}

export async function suspendUser(userId: string, adminUserId: string) {
  await db.update(users).set({ status: 'suspended', updatedAt: new Date() }).where(eq(users.id, userId));
  await writeAdminAuditLog({
    adminUserId,
    action: 'suspend_user',
    targetType: 'user',
    targetId: userId,
  });
}

export async function activateUser(userId: string, adminUserId: string) {
  await db.update(users).set({ status: 'active', updatedAt: new Date() }).where(eq(users.id, userId));
  await writeAdminAuditLog({
    adminUserId,
    action: 'activate_user',
    targetType: 'user',
    targetId: userId,
  });
}
