import { NextResponse } from 'next/server';
import { requireAdminSession, requireSuperAdminSession } from '@/lib/billing/api-auth';
import {
  getPlatformSettings,
  setDemoLoginEnabled,
  setDefaultSignupPlanId,
} from '@/lib/platform/settings';
import { listPlans } from '@/lib/billing/plans';
import { parseJsonBody } from '@/lib/validation/http';
import { platformSettingsPatchSchema } from '@/lib/validation/platform';

export async function GET() {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const [settings, plans] = await Promise.all([getPlatformSettings(), listPlans(true)]);

  const defaultPlan = settings.defaultSignupPlanId
    ? plans.find((p) => p.id === settings.defaultSignupPlanId)
    : plans.find((p) => p.slug === 'starter');

  return NextResponse.json({
    settings,
    plans: plans.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      monthlyTokens: p.monthlyTokens,
      featureFlags: p.featureFlags,
    })),
    effectiveDefaultPlan: defaultPlan
      ? { id: defaultPlan.id, slug: defaultPlan.slug, name: defaultPlan.name }
      : null,
  });
}

export async function PATCH(req: Request) {
  const authResult = await requireSuperAdminSession();
  if ('error' in authResult) return authResult.error;

  const parsed = await parseJsonBody(req, platformSettingsPatchSchema);
  if ('error' in parsed) return parsed.error;

  let settings = await getPlatformSettings();

  if (parsed.data.demoLoginEnabled !== undefined) {
    settings = await setDemoLoginEnabled(parsed.data.demoLoginEnabled, authResult.admin.id);
  }

  if (parsed.data.defaultSignupPlanId !== undefined) {
    settings = await setDefaultSignupPlanId(
      parsed.data.defaultSignupPlanId,
      authResult.admin.id
    );
  }

  return NextResponse.json({ settings });
}
