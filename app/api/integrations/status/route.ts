import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getActivePluginStatuses } from '@/lib/plugins/integrations';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const plugins = await getActivePluginStatuses(session.user.id);
  const activePlugins = plugins.filter((p) => p.connected).map((p) => p.id);

  return NextResponse.json({ plugins, activePlugins });
}
