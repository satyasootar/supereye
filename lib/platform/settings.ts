import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { platformSettings, plans } from '@/lib/db/schema';
import { writeAdminAuditLog } from '@/lib/billing/audit-log';

const PLATFORM_SETTINGS_ID = 'default';

export type PlatformSettings = {
  demoLoginEnabled: boolean;
  defaultSignupPlanId: string | null;
  updatedAt: Date | null;
};

const DEFAULT_SETTINGS: PlatformSettings = {
  demoLoginEnabled: true,
  defaultSignupPlanId: null,
  updatedAt: null,
};

function isNextProductionBuild() {
  return process.env.NEXT_PHASE === 'phase-production-build';
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  if (isNextProductionBuild()) {
    return DEFAULT_SETTINGS;
  }

  const [row] = await db
    .select({
      demoLoginEnabled: platformSettings.demoLoginEnabled,
      defaultSignupPlanId: platformSettings.defaultSignupPlanId,
      updatedAt: platformSettings.updatedAt,
    })
    .from(platformSettings)
    .where(eq(platformSettings.id, PLATFORM_SETTINGS_ID))
    .limit(1);

  if (!row) {
    await db
      .insert(platformSettings)
      .values({ id: PLATFORM_SETTINGS_ID, demoLoginEnabled: true })
      .onConflictDoNothing();

    return DEFAULT_SETTINGS;
  }

  return row;
}

export async function getDefaultSignupPlanId(): Promise<string | null> {
  const settings = await getPlatformSettings();
  if (settings.defaultSignupPlanId) {
    const [plan] = await db
      .select({ id: plans.id })
      .from(plans)
      .where(eq(plans.id, settings.defaultSignupPlanId))
      .limit(1);
    if (plan) return plan.id;
  }

  return getStarterPlanIdFromDb();
}

async function getStarterPlanIdFromDb(): Promise<string | null> {
  const [starter] = await db
    .select({ id: plans.id })
    .from(plans)
    .where(eq(plans.slug, 'starter'))
    .limit(1);
  return starter?.id ?? null;
}

export async function resolveDefaultSignupPlan() {
  const planId = await getDefaultSignupPlanId();
  if (!planId) return null;

  const [plan] = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
  return plan ?? null;
}

export async function setDemoLoginEnabled(enabled: boolean, adminUserId: string) {
  return patchPlatformSettings({ demoLoginEnabled: enabled }, adminUserId);
}

export async function setDefaultSignupPlanId(planId: string | null, adminUserId: string) {
  if (planId) {
    const [plan] = await db.select({ id: plans.id }).from(plans).where(eq(plans.id, planId)).limit(1);
    if (!plan) throw new Error('Plan not found');
  }

  return patchPlatformSettings({ defaultSignupPlanId: planId }, adminUserId);
}

async function patchPlatformSettings(
  patch: Partial<Pick<PlatformSettings, 'demoLoginEnabled' | 'defaultSignupPlanId'>>,
  adminUserId: string
) {
  const [row] = await db
    .insert(platformSettings)
    .values({
      id: PLATFORM_SETTINGS_ID,
      demoLoginEnabled: patch.demoLoginEnabled ?? true,
      defaultSignupPlanId: patch.defaultSignupPlanId ?? null,
      updatedBy: adminUserId,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: platformSettings.id,
      set: {
        ...(patch.demoLoginEnabled !== undefined
          ? { demoLoginEnabled: patch.demoLoginEnabled }
          : {}),
        ...(patch.defaultSignupPlanId !== undefined
          ? { defaultSignupPlanId: patch.defaultSignupPlanId }
          : {}),
        updatedBy: adminUserId,
        updatedAt: new Date(),
      },
    })
    .returning({
      demoLoginEnabled: platformSettings.demoLoginEnabled,
      defaultSignupPlanId: platformSettings.defaultSignupPlanId,
      updatedAt: platformSettings.updatedAt,
    });

  await writeAdminAuditLog({
    adminUserId,
    action: 'update_platform_settings',
    targetType: 'platform_settings',
    targetId: PLATFORM_SETTINGS_ID,
    metadata: patch,
  });

  return row ?? { ...DEFAULT_SETTINGS, ...patch, updatedAt: new Date() };
}
