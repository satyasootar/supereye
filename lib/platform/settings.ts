import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { platformSettings } from '@/lib/db/schema';
import { writeAdminAuditLog } from '@/lib/billing/audit-log';

const PLATFORM_SETTINGS_ID = 'default';

export type PlatformSettings = {
  demoLoginEnabled: boolean;
  updatedAt: Date | null;
};

const DEFAULT_SETTINGS: PlatformSettings = {
  demoLoginEnabled: true,
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

export async function setDemoLoginEnabled(enabled: boolean, adminUserId: string) {
  const [row] = await db
    .insert(platformSettings)
    .values({
      id: PLATFORM_SETTINGS_ID,
      demoLoginEnabled: enabled,
      updatedBy: adminUserId,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: platformSettings.id,
      set: {
        demoLoginEnabled: enabled,
        updatedBy: adminUserId,
        updatedAt: new Date(),
      },
    })
    .returning({
      demoLoginEnabled: platformSettings.demoLoginEnabled,
      updatedAt: platformSettings.updatedAt,
    });

  await writeAdminAuditLog({
    adminUserId,
    action: 'update_platform_settings',
    targetType: 'platform_settings',
    targetId: PLATFORM_SETTINGS_ID,
    metadata: { demoLoginEnabled: enabled },
  });

  return row ?? { demoLoginEnabled: enabled, updatedAt: new Date() };
}
