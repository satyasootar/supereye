import { eq, desc, sql, and, gte, count, sum } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  users,
  subscriptions,
  plans,
  tokenWallets,
  tokenLedger,
  tokenActionCosts,
  tokenTopUpPacks,
  invoices,
  payments,
  aiUsageEvents,
  corsairAccounts,
  organizations,
  enterpriseAccounts,
} from '@/lib/db/schema';
import { resetPeriodTokens, adjustTokens } from './tokens';
import { writeAdminAuditLog, listAuditLogs as fetchAuditLogs } from './audit-log';
import {
  ANALYTICS_WINDOW_DAYS,
  fillDailySeries,
  normalizeDayKey,
} from './chart-series';

export async function listPlans(includeInactive = false) {
  if (includeInactive) {
    return db.select().from(plans).orderBy(plans.sortOrder);
  }
  return db.select().from(plans).where(eq(plans.isActive, true)).orderBy(plans.sortOrder);
}

export async function getPlanById(planId: string) {
  const [plan] = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
  return plan ?? null;
}

export async function updatePlan(
  planId: string,
  data: Partial<{
    name: string;
    description: string;
    priceCents: number;
    monthlyTokens: number;
    featureFlags: Record<string, boolean>;
    pluginLimit: number | null;
    teamMemberLimit: number | null;
    isActive: boolean;
  }>,
  adminUserId: string
) {
  const [updated] = await db
    .update(plans)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(plans.id, planId))
    .returning();

  await writeAdminAuditLog({
    adminUserId,
    action: 'update_plan',
    targetType: 'plan',
    targetId: planId,
    metadata: data,
  });

  return updated;
}

export async function createEnterprisePlan(
  data: {
    name: string;
    description?: string;
    priceCents?: number;
    monthlyTokens: number;
    featureFlags?: Record<string, boolean>;
    pluginLimit?: number | null;
    teamMemberLimit?: number | null;
  },
  adminUserId: string
) {
  const slug = `enterprise-${Date.now()}`;
  const [plan] = await db
    .insert(plans)
    .values({
      slug,
      name: data.name,
      description: data.description ?? null,
      priceCents: data.priceCents ?? 0,
      monthlyTokens: data.monthlyTokens,
      isEnterprise: true,
      isActive: true,
      featureFlags: data.featureFlags ?? { all_features: true },
      pluginLimit: data.pluginLimit ?? null,
      teamMemberLimit: data.teamMemberLimit ?? null,
      sortOrder: 100,
      billingInterval: 'month',
    })
    .returning();

  await writeAdminAuditLog({
    adminUserId,
    action: 'create_enterprise_plan',
    targetType: 'plan',
    targetId: plan.id,
    metadata: data,
  });

  return plan;
}

export async function listTokenActionCosts() {
  return db.select().from(tokenActionCosts).orderBy(tokenActionCosts.displayName);
}

export async function updateTokenActionCost(
  id: string,
  data: { tokenCost?: number; displayName?: string; isActive?: boolean },
  adminUserId: string
) {
  const [row] = await db
    .update(tokenActionCosts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(tokenActionCosts.id, id))
    .returning();

  await writeAdminAuditLog({
    adminUserId,
    action: 'update_token_cost',
    targetType: 'token_action_cost',
    targetId: id,
    metadata: data,
  });

  return row;
}

export async function listTopUpPacks() {
  return db
    .select()
    .from(tokenTopUpPacks)
    .where(eq(tokenTopUpPacks.isActive, true))
    .orderBy(tokenTopUpPacks.sortOrder);
}

export async function listAllTopUpPacks() {
  return db.select().from(tokenTopUpPacks).orderBy(tokenTopUpPacks.sortOrder);
}

export async function updateTopUpPack(
  id: string,
  data: Partial<{
    name: string;
    tokenAmount: number;
    priceCents: number;
    isActive: boolean;
    sortOrder: number;
  }>,
  adminUserId: string
) {
  const [row] = await db
    .update(tokenTopUpPacks)
    .set(data)
    .where(eq(tokenTopUpPacks.id, id))
    .returning();

  await writeAdminAuditLog({
    adminUserId,
    action: 'update_top_up_pack',
    targetType: 'token_top_up_pack',
    targetId: id,
    metadata: data,
  });

  return row;
}

export async function listInvoices(params: {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;

  const conditions = [];
  if (params.status) conditions.push(eq(invoices.status, params.status as 'paid'));

  const rows = await db
    .select({
      invoice: invoices,
      userName: users.name,
      userEmail: users.email,
      planName: plans.name,
    })
    .from(invoices)
    .innerJoin(users, eq(invoices.userId, users.id))
    .leftJoin(plans, eq(invoices.planId, plans.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(invoices.issuedAt))
    .limit(limit)
    .offset(offset);

  if (params.search) {
    const q = params.search.toLowerCase();
    return rows.filter(
      (r) =>
        r.invoice.invoiceNumber.toLowerCase().includes(q) ||
        r.userEmail?.toLowerCase().includes(q) ||
        r.userName?.toLowerCase().includes(q)
    );
  }

  return rows;
}

export async function listTokenLedger(params: {
  userId?: string;
  limit?: number;
  offset?: number;
}) {
  const limit = params.limit ?? 100;
  const offset = params.offset ?? 0;

  const conditions = params.userId ? eq(tokenLedger.userId, params.userId) : undefined;

  return db
    .select({
      entry: tokenLedger,
      userEmail: users.email,
      userName: users.name,
    })
    .from(tokenLedger)
    .innerJoin(users, eq(tokenLedger.userId, users.id))
    .where(conditions)
    .orderBy(desc(tokenLedger.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function listAuditLogs(params: { limit?: number; offset?: number }) {
  const { logs } = await fetchAuditLogs(params);
  return logs;
}

export async function getUserDetailForAdmin(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  const [wallet] = await db
    .select()
    .from(tokenWallets)
    .where(eq(tokenWallets.userId, userId))
    .limit(1);

  const [sub] = await db
    .select({ subscription: subscriptions, plan: plans })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
    .limit(1);

  const pluginRows = await db
    .select({ integrationId: corsairAccounts.integrationId })
    .from(corsairAccounts)
    .where(eq(corsairAccounts.tenantId, userId));

  const userInvoices = await db
    .select()
    .from(invoices)
    .where(eq(invoices.userId, userId))
    .orderBy(desc(invoices.issuedAt))
    .limit(20);

  const ledger = await listTokenLedger({ userId, limit: 50 });

  return {
    user,
    wallet,
    subscription: sub?.subscription ?? null,
    plan: sub?.plan ?? null,
    plugins: pluginRows.map((p) => p.integrationId),
    invoices: userInvoices,
    ledger,
  };
}

export async function updateUserAdmin(
  userId: string,
  data: {
    role?: 'super_admin' | 'user' | 'enterprise_user';
    name?: string;
  },
  adminUserId: string
) {
  const [updated] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();

  await writeAdminAuditLog({
    adminUserId,
    action: 'update_user',
    targetType: 'user',
    targetId: userId,
    metadata: data,
  });

  return updated;
}

export async function deleteUserAdmin(userId: string, adminUserId: string) {
  await writeAdminAuditLog({
    adminUserId,
    action: 'delete_user',
    targetType: 'user',
    targetId: userId,
  });
  await db.delete(users).where(eq(users.id, userId));
}

export async function listEnterpriseAccounts() {
  return db
    .select({
      account: enterpriseAccounts,
      org: organizations,
      user: users,
      plan: plans,
    })
    .from(enterpriseAccounts)
    .innerJoin(organizations, eq(enterpriseAccounts.organizationId, organizations.id))
    .innerJoin(users, eq(enterpriseAccounts.userId, users.id))
    .leftJoin(plans, eq(enterpriseAccounts.customPlanId, plans.id));
}

export async function createEnterpriseAccount(params: {
  organizationName: string;
  userId: string;
  customPlanId?: string;
  customMonthlyTokens?: number;
  customFeatureFlags?: Record<string, boolean>;
  customPluginLimit?: number | null;
  customTeamMemberLimit?: number | null;
  adminUserId: string;
}) {
  const [org] = await db
    .insert(organizations)
    .values({ name: params.organizationName, ownerUserId: params.userId })
    .returning();

  const [account] = await db
    .insert(enterpriseAccounts)
    .values({
      organizationId: org.id,
      userId: params.userId,
      customPlanId: params.customPlanId ?? null,
      customMonthlyTokens: params.customMonthlyTokens ?? null,
      customFeatureFlags: params.customFeatureFlags ?? null,
      customPluginLimit: params.customPluginLimit ?? null,
      customTeamMemberLimit: params.customTeamMemberLimit ?? null,
    })
    .returning();

  await db
    .update(users)
    .set({ role: 'enterprise_user', updatedAt: new Date() })
    .where(eq(users.id, params.userId));

  if (params.customMonthlyTokens) {
    await resetPeriodTokens(params.userId, params.customMonthlyTokens);
  }

  await writeAdminAuditLog({
    adminUserId: params.adminUserId,
    action: 'create_enterprise_account',
    targetType: 'enterprise_account',
    targetId: account.id,
    metadata: {
      organizationName: params.organizationName,
      userId: params.userId,
      customPlanId: params.customPlanId,
      customMonthlyTokens: params.customMonthlyTokens,
    },
  });

  return { org, account };
}

export async function getAnalyticsCharts() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - ANALYTICS_WINDOW_DAYS);

  const dayExpr = (column: unknown) =>
    sql<string>`to_char(date_trunc('day', ${column}), 'YYYY-MM-DD')`;

  const userGrowth = await db
    .select({
      day: dayExpr(users.createdAt),
      count: count(),
    })
    .from(users)
    .where(gte(users.createdAt, thirtyDaysAgo))
    .groupBy(sql`date_trunc('day', ${users.createdAt})`)
    .orderBy(sql`date_trunc('day', ${users.createdAt})`);

  const revenueGrowth = await db
    .select({
      day: dayExpr(invoices.issuedAt),
      total: sum(invoices.amountCents),
    })
    .from(invoices)
    .where(and(eq(invoices.status, 'paid'), gte(invoices.issuedAt, thirtyDaysAgo)))
    .groupBy(sql`date_trunc('day', ${invoices.issuedAt})`)
    .orderBy(sql`date_trunc('day', ${invoices.issuedAt})`);

  const planDistribution = await db
    .select({
      planName: plans.name,
      count: count(),
    })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(eq(subscriptions.status, 'active'))
    .groupBy(plans.name);

  const billingTokenRows = await db
    .select({
      day: dayExpr(tokenLedger.createdAt),
      total: sum(tokenLedger.tokensRemoved),
    })
    .from(tokenLedger)
    .where(and(eq(tokenLedger.action, 'ai_usage'), gte(tokenLedger.createdAt, thirtyDaysAgo)))
    .groupBy(sql`date_trunc('day', ${tokenLedger.createdAt})`)
    .orderBy(sql`date_trunc('day', ${tokenLedger.createdAt})`);

  const llmTokenRows = await db
    .select({
      day: dayExpr(aiUsageEvents.createdAt),
      total: sum(aiUsageEvents.totalTokens),
    })
    .from(aiUsageEvents)
    .where(gte(aiUsageEvents.createdAt, thirtyDaysAgo))
    .groupBy(sql`date_trunc('day', ${aiUsageEvents.createdAt})`)
    .orderBy(sql`date_trunc('day', ${aiUsageEvents.createdAt})`);

  const dailyAiUsage = await db
    .select({
      day: dayExpr(aiUsageEvents.createdAt),
      count: count(),
    })
    .from(aiUsageEvents)
    .where(gte(aiUsageEvents.createdAt, thirtyDaysAgo))
    .groupBy(sql`date_trunc('day', ${aiUsageEvents.createdAt})`)
    .orderBy(sql`date_trunc('day', ${aiUsageEvents.createdAt})`);

  const tokenByFeature = await db
    .select({
      feature: aiUsageEvents.feature,
      total: sum(aiUsageEvents.totalTokens),
      count: count(),
    })
    .from(aiUsageEvents)
    .where(gte(aiUsageEvents.createdAt, thirtyDaysAgo))
    .groupBy(aiUsageEvents.feature)
    .orderBy(sql`sum(${aiUsageEvents.totalTokens}) desc`);

  const mapSeries = (rows: { day: string; total?: unknown; count?: unknown }[], valueKey: 'total' | 'count') =>
    fillDailySeries(
      rows.map((row) => ({
        day: normalizeDayKey(row.day),
        value: Number(valueKey === 'total' ? (row.total ?? 0) : (row.count ?? 0)),
      }))
    );

  const llmTokenUsage = mapSeries(llmTokenRows, 'total');
  const billingCredits = mapSeries(billingTokenRows, 'total');

  return {
    userGrowth: fillDailySeries(
      userGrowth.map((row) => ({ day: normalizeDayKey(row.day), value: row.count }))
    ),
    revenueGrowth: fillDailySeries(
      revenueGrowth.map((row) => ({
        day: normalizeDayKey(row.day),
        value: Number(row.total ?? 0),
      }))
    ),
    planDistribution: planDistribution.map((row) => ({
      label: row.planName,
      value: row.count,
    })),
    /** LLM tokens consumed (matches overview stat). */
    tokenConsumption: llmTokenUsage,
    llmTokenUsage,
    billingCredits,
    dailyAiUsage: mapSeries(dailyAiUsage, 'count'),
    tokenByFeature: tokenByFeature.map((row) => ({
      label: row.feature,
      value: Number(row.total ?? 0),
      requests: row.count,
    })),
  };
}

export async function purchaseTopUpPack(userId: string, packId: string) {
  const [pack] = await db
    .select()
    .from(tokenTopUpPacks)
    .where(and(eq(tokenTopUpPacks.id, packId), eq(tokenTopUpPacks.isActive, true)))
    .limit(1);
  if (!pack) throw new Error('Pack not found');

  const invoiceNumber = `TOPUP-${Date.now()}`;
  const [invoice] = await db
    .insert(invoices)
    .values({
      invoiceNumber,
      userId,
      amountCents: pack.priceCents,
      status: 'paid',
      paymentMethod: 'simulated',
      issuedAt: new Date(),
      metadata: { packId: pack.id, tokenAmount: pack.tokenAmount },
    })
    .returning();

  await db.insert(payments).values({
    invoiceId: invoice.id,
    userId,
    amountCents: pack.priceCents,
    status: 'completed',
    paymentMethod: 'simulated',
  });

  await adjustTokens({
    userId,
    amount: pack.tokenAmount,
    action: 'token_purchase',
    reason: `Purchased ${pack.name}`,
    metadata: { packId: pack.id, invoiceId: invoice.id },
  });

  return { invoice, pack };
}
