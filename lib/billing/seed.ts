import { eq, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  plans,
  tokenActionCosts,
  tokenTopUpPacks,
  users,
  tokenWallets,
} from '@/lib/db/schema';
import {
  DEFAULT_TOKEN_ACTION_COSTS,
  DEFAULT_TOP_UP_PACKS,
  DEFAULT_STARTER_TOKENS,
  DEFAULT_PRO_TOKENS,
} from './constants';
import { isSuperAdminEmail } from './rbac';

const DEFAULT_PLANS = [
  {
    slug: 'starter',
    name: 'Starter',
    description: 'For individuals getting started',
    priceCents: 2000,
    monthlyTokens: DEFAULT_STARTER_TOKENS,
    featureFlags: {
      ai_chat: true,
      ai_email_reply: true,
      ai_email_draft: true,
      ai_triage: true,
    },
    pluginLimit: 2,
    teamMemberLimit: 1,
    sortOrder: 1,
  },
  {
    slug: 'pro',
    name: 'Pro',
    description: 'For power users who need more AI capacity',
    priceCents: 10000,
    monthlyTokens: DEFAULT_PRO_TOKENS,
    featureFlags: {
      ai_chat: true,
      ai_email_reply: true,
      ai_email_draft: true,
      ai_triage: true,
      priority_processing: true,
      advanced_automations: true,
    },
    pluginLimit: 5,
    teamMemberLimit: 3,
    sortOrder: 2,
  },
  {
    slug: 'enterprise',
    name: 'Enterprise',
    description: 'Custom pricing and limits for teams',
    priceCents: 0,
    monthlyTokens: 0,
    isEnterprise: true,
    featureFlags: { all_features: true },
    pluginLimit: null,
    teamMemberLimit: null,
    sortOrder: 3,
  },
];

export async function ensureBillingSeed() {
  const [{ planCount }] = await db.select({ planCount: count() }).from(plans);
  if (planCount === 0) {
    await db.insert(plans).values(
      DEFAULT_PLANS.map((p) => ({
        ...p,
        isEnterprise: p.isEnterprise ?? false,
        isActive: true,
        billingInterval: 'month',
        featureFlags: p.featureFlags as unknown as Record<string, boolean>,
      }))
    );
  }

  for (const cost of DEFAULT_TOKEN_ACTION_COSTS) {
    const existing = await db
      .select({ id: tokenActionCosts.id })
      .from(tokenActionCosts)
      .where(eq(tokenActionCosts.actionKey, cost.actionKey))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(tokenActionCosts).values({ ...cost, isActive: true });
    }
  }

  const [{ packCount }] = await db.select({ packCount: count() }).from(tokenTopUpPacks);
  if (packCount === 0) {
    await db.insert(tokenTopUpPacks).values(
      DEFAULT_TOP_UP_PACKS.map((p) => ({ ...p, isActive: true }))
    );
  }
}

export async function bootstrapUserBilling(userId: string, email: string | null | undefined) {
  await ensureBillingSeed();

  const superAdmin = isSuperAdminEmail(email);

  if (superAdmin) {
    await db
      .update(users)
      .set({ role: 'super_admin', updatedAt: new Date() })
      .where(eq(users.id, userId));

    const [wallet] = await db
      .select()
      .from(tokenWallets)
      .where(eq(tokenWallets.userId, userId))
      .limit(1);

    if (!wallet) {
      await db.insert(tokenWallets).values({
        userId,
        balance: 0,
        monthlyAllocation: 0,
        usedThisPeriod: 0,
        unlimited: true,
      });
    } else if (!wallet.unlimited) {
      await db
        .update(tokenWallets)
        .set({ unlimited: true, updatedAt: new Date() })
        .where(eq(tokenWallets.userId, userId));
    }
    return;
  }

  const [wallet] = await db
    .select()
    .from(tokenWallets)
    .where(eq(tokenWallets.userId, userId))
    .limit(1);

  if (!wallet) {
    const [proPlan] = await db
      .select()
      .from(plans)
      .where(eq(plans.slug, 'pro'))
      .limit(1);

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const allocation = proPlan?.monthlyTokens ?? DEFAULT_PRO_TOKENS;

    await db.insert(tokenWallets).values({
      userId,
      balance: allocation,
      monthlyAllocation: allocation,
      bonusAllocation: 0,
      usedThisPeriod: 0,
      periodStart: now,
      periodEnd,
      unlimited: false,
    });
  }
}

export async function getProPlanId() {
  const [pro] = await db
    .select({ id: plans.id })
    .from(plans)
    .where(eq(plans.slug, 'pro'))
    .limit(1);
  return pro?.id ?? null;
}

export async function getStarterPlanId() {
  const [starter] = await db
    .select({ id: plans.id })
    .from(plans)
    .where(eq(plans.slug, 'starter'))
    .limit(1);
  return starter?.id ?? null;
}
