import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { plans } from '@/lib/db/schema';
import { assignPlanToUser } from '@/lib/billing/admin';
import { ensureBillingSeed } from '@/lib/billing/seed';

/** Demo logins always run on Pro so evaluators see the full product surface. */
export async function ensureDemoAccountProPlan(userId: string) {
  await ensureBillingSeed();

  const [pro] = await db
    .select({ id: plans.id })
    .from(plans)
    .where(eq(plans.slug, 'pro'))
    .limit(1);

  if (!pro) return;

  await assignPlanToUser({ userId, planId: pro.id });
}
