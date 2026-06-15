import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { getActivePluginStatuses } from '@/lib/plugins/integrations';

export async function GET() {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const plugins = await getActivePluginStatuses(session.user.id);
  const activePlugins = plugins.filter((p) => p.connected).map((p) => p.id);

  return NextResponse.json({ plugins, activePlugins });
}
