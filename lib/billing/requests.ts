import { and, desc, eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/lib/db';
import {
  billingRequests,
  plans,
  tokenTopUpPacks,
  users,
  type BillingRequestStatus,
  type BillingRequestType,
} from '@/lib/db/schema';
import { assignPlanToUser, getUserSubscription } from './admin';
import { getPlanById } from './plans';
import { adjustTokens } from './tokens';
import { writeAdminAuditLog } from './audit-log';
import { sendBillingRequestEmail } from '@/lib/email/billing-request';

const requestUser = alias(users, 'request_user');
const adminUser = alias(users, 'admin_user');

export class BillingRequestError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'BillingRequestError';
    this.status = status;
  }
}

async function getUserEmail(userId: string) {
  const [row] = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row ?? null;
}

async function assertNoDuplicatePending(params: {
  userId: string;
  type: BillingRequestType;
  packId?: string;
  planId?: string;
}) {
  const conditions = [
    eq(billingRequests.userId, params.userId),
    eq(billingRequests.status, 'pending'),
    eq(billingRequests.type, params.type),
  ];

  if (params.packId) {
    conditions.push(eq(billingRequests.packId, params.packId));
  }
  if (params.planId) {
    conditions.push(eq(billingRequests.planId, params.planId));
  }

  const [existing] = await db
    .select({ id: billingRequests.id })
    .from(billingRequests)
    .where(and(...conditions))
    .limit(1);

  if (existing) {
    throw new BillingRequestError('You already have a pending request for this item');
  }
}

export async function createCreditTopUpRequest(
  userId: string,
  packId: string,
  userNote?: string
) {
  const [pack] = await db
    .select()
    .from(tokenTopUpPacks)
    .where(and(eq(tokenTopUpPacks.id, packId), eq(tokenTopUpPacks.isActive, true)))
    .limit(1);

  if (!pack) throw new BillingRequestError('Credit pack not found');

  await assertNoDuplicatePending({ userId, type: 'credit_top_up', packId });

  const [request] = await db
    .insert(billingRequests)
    .values({
      userId,
      type: 'credit_top_up',
      packId,
      userNote: userNote?.trim() || null,
      metadata: {
        packName: pack.name,
        tokenAmount: pack.tokenAmount,
        priceCents: pack.priceCents,
      },
    })
    .returning();

  return request;
}

export async function createSubscriptionChangeRequest(
  userId: string,
  planId: string,
  userNote?: string
) {
  const plan = await getPlanById(planId);
  if (!plan || !plan.isActive) throw new BillingRequestError('Plan not found');
  if (plan.isEnterprise) {
    throw new BillingRequestError('Enterprise plans require admin setup. Contact support.');
  }

  const subscription = await getUserSubscription(userId);
  const currentPlanId = subscription?.plan.id ?? null;

  if (currentPlanId === planId) {
    throw new BillingRequestError('You are already on this plan');
  }

  await assertNoDuplicatePending({ userId, type: 'subscription_change', planId });

  const [request] = await db
    .insert(billingRequests)
    .values({
      userId,
      type: 'subscription_change',
      planId,
      currentPlanId,
      userNote: userNote?.trim() || null,
      metadata: {
        planName: plan.name,
        planSlug: plan.slug,
        priceCents: plan.priceCents,
        monthlyTokens: plan.monthlyTokens,
        currentPlanName: subscription?.plan.name ?? null,
      },
    })
    .returning();

  return request;
}

function mapRequestRow(row: {
  request: typeof billingRequests.$inferSelect;
  userEmail: string | null;
  userName: string | null;
  packName: string | null;
  packTokenAmount: number | null;
  packPriceCents: number | null;
  planName: string | null;
  planPriceCents: number | null;
  currentPlanName: string | null;
  adminEmail: string | null;
  adminName: string | null;
}) {
  return {
    ...row.request,
    createdAt: row.request.createdAt.toISOString(),
    updatedAt: row.request.updatedAt.toISOString(),
    processedAt: row.request.processedAt?.toISOString() ?? null,
    userEmail: row.userEmail,
    userName: row.userName,
    packName: row.packName,
    packTokenAmount: row.packTokenAmount,
    packPriceCents: row.packPriceCents,
    planName: row.planName,
    planPriceCents: row.planPriceCents,
    currentPlanName: row.currentPlanName,
    adminEmail: row.adminEmail,
    adminName: row.adminName,
  };
}

async function fetchRequestRows(params: {
  userId?: string;
  status?: BillingRequestStatus;
  limit?: number;
  offset?: number;
}) {
  const conditions = [];
  if (params.userId) conditions.push(eq(billingRequests.userId, params.userId));
  if (params.status) conditions.push(eq(billingRequests.status, params.status));

  const whereClause = conditions.length ? and(...conditions) : undefined;
  const currentPlan = alias(plans, 'current_plan');

  const baseQuery = db
    .select({
      request: billingRequests,
      userEmail: requestUser.email,
      userName: requestUser.name,
      packName: tokenTopUpPacks.name,
      packTokenAmount: tokenTopUpPacks.tokenAmount,
      packPriceCents: tokenTopUpPacks.priceCents,
      planName: plans.name,
      planPriceCents: plans.priceCents,
      currentPlanName: currentPlan.name,
      adminEmail: adminUser.email,
      adminName: adminUser.name,
    })
    .from(billingRequests)
    .innerJoin(requestUser, eq(billingRequests.userId, requestUser.id))
    .leftJoin(tokenTopUpPacks, eq(billingRequests.packId, tokenTopUpPacks.id))
    .leftJoin(plans, eq(billingRequests.planId, plans.id))
    .leftJoin(currentPlan, eq(billingRequests.currentPlanId, currentPlan.id))
    .leftJoin(adminUser, eq(billingRequests.adminUserId, adminUser.id))
    .where(whereClause)
    .orderBy(desc(billingRequests.createdAt));

  const rows = await baseQuery
    .limit(params.limit ?? 50)
    .offset(params.offset ?? 0);

  const [totalRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(billingRequests)
    .where(whereClause);

  return {
    requests: rows.map(mapRequestRow),
    total: totalRow?.total ?? 0,
  };
}

export async function listUserBillingRequests(userId: string) {
  return fetchRequestRows({ userId, limit: 20 });
}

export async function listAdminBillingRequests(params: {
  status?: BillingRequestStatus;
  limit?: number;
  offset?: number;
}) {
  return fetchRequestRows(params);
}

export async function countPendingBillingRequests() {
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(billingRequests)
    .where(eq(billingRequests.status, 'pending'));
  return row?.total ?? 0;
}

async function fulfillCreditTopUpRequest(
  request: typeof billingRequests.$inferSelect,
  adminUserId: string
) {
  if (!request.packId) throw new BillingRequestError('Missing pack on request');

  const [pack] = await db
    .select()
    .from(tokenTopUpPacks)
    .where(eq(tokenTopUpPacks.id, request.packId))
    .limit(1);

  if (!pack) throw new BillingRequestError('Credit pack no longer exists');

  await adjustTokens({
    userId: request.userId,
    amount: pack.tokenAmount,
    action: 'token_purchase',
    reason: `Approved credit request: ${pack.name}`,
    adminUserId,
    metadata: { requestId: request.id, packId: pack.id },
  });

  await writeAdminAuditLog({
    adminUserId,
    action: 'approve_credit_request',
    targetType: 'user',
    targetId: request.userId,
    metadata: {
      requestId: request.id,
      packName: pack.name,
      tokenAmount: pack.tokenAmount,
      priceCents: pack.priceCents,
    },
  });

  return { pack };
}

async function fulfillSubscriptionChangeRequest(
  request: typeof billingRequests.$inferSelect,
  adminUserId: string
) {
  if (!request.planId) throw new BillingRequestError('Missing plan on request');

  const plan = await assignPlanToUser({
    userId: request.userId,
    planId: request.planId,
    adminUserId,
  });

  await writeAdminAuditLog({
    adminUserId,
    action: 'approve_subscription_request',
    targetType: 'user',
    targetId: request.userId,
    metadata: {
      requestId: request.id,
      planName: plan.name,
      previousPlanId: request.currentPlanId,
    },
  });

  return { plan };
}

export async function approveBillingRequest(
  requestId: string,
  adminUserId: string,
  adminNote?: string
) {
  const [request] = await db
    .select()
    .from(billingRequests)
    .where(eq(billingRequests.id, requestId))
    .limit(1);

  if (!request) throw new BillingRequestError('Request not found', 404);
  if (request.status !== 'pending') {
    throw new BillingRequestError('Request has already been processed');
  }

  let fulfillment: { pack?: { name: string; tokenAmount: number }; plan?: { name: string } } = {};

  if (request.type === 'credit_top_up') {
    fulfillment = await fulfillCreditTopUpRequest(request, adminUserId);
  } else if (request.type === 'subscription_change') {
    fulfillment = await fulfillSubscriptionChangeRequest(request, adminUserId);
  }

  const now = new Date();
  const [updated] = await db
    .update(billingRequests)
    .set({
      status: 'approved',
      adminUserId,
      adminNote: adminNote?.trim() || null,
      processedAt: now,
      updatedAt: now,
    })
    .where(eq(billingRequests.id, requestId))
    .returning();

  const user = await getUserEmail(request.userId);
  if (user?.email) {
    await sendBillingRequestEmail({
      to: user.email,
      userName: user.name,
      outcome: 'approved',
      requestType: request.type,
      packName: fulfillment.pack?.name,
      tokenAmount: fulfillment.pack?.tokenAmount,
      planName: fulfillment.plan?.name,
      adminNote: adminNote?.trim(),
    });
  }

  return updated;
}

export async function rejectBillingRequest(
  requestId: string,
  adminUserId: string,
  adminNote?: string
) {
  const [request] = await db
    .select()
    .from(billingRequests)
    .where(eq(billingRequests.id, requestId))
    .limit(1);

  if (!request) throw new BillingRequestError('Request not found', 404);
  if (request.status !== 'pending') {
    throw new BillingRequestError('Request has already been processed');
  }

  const now = new Date();
  const [updated] = await db
    .update(billingRequests)
    .set({
      status: 'rejected',
      adminUserId,
      adminNote: adminNote?.trim() || null,
      processedAt: now,
      updatedAt: now,
    })
    .where(eq(billingRequests.id, requestId))
    .returning();

  await writeAdminAuditLog({
    adminUserId,
    action: 'reject_billing_request',
    targetType: 'user',
    targetId: request.userId,
    metadata: {
      requestId: request.id,
      requestType: request.type,
      adminNote: adminNote?.trim() ?? null,
    },
  });

  const user = await getUserEmail(request.userId);
  if (user?.email) {
    const metadata = (request.metadata ?? {}) as Record<string, unknown>;
    await sendBillingRequestEmail({
      to: user.email,
      userName: user.name,
      outcome: 'rejected',
      requestType: request.type,
      packName: typeof metadata.packName === 'string' ? metadata.packName : undefined,
      planName: typeof metadata.planName === 'string' ? metadata.planName : undefined,
      adminNote: adminNote?.trim(),
    });
  }

  return updated;
}
