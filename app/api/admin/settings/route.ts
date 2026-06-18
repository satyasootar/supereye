import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/billing/api-auth';
import { getPlatformSettings, setDemoLoginEnabled } from '@/lib/platform/settings';
import { parseJsonBody } from '@/lib/validation/http';
import { platformSettingsPatchSchema } from '@/lib/validation/platform';

export async function GET() {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const settings = await getPlatformSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(req: Request) {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const parsed = await parseJsonBody(req, platformSettingsPatchSchema);
  if ('error' in parsed) return parsed.error;

  const settings = await setDemoLoginEnabled(
    parsed.data.demoLoginEnabled,
    authResult.admin.id
  );

  return NextResponse.json({ settings });
}
