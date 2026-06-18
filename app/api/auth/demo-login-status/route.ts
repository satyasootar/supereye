import { NextResponse } from 'next/server';
import { getPlatformSettings } from '@/lib/platform/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = await getPlatformSettings();
  return NextResponse.json({ enabled: settings.demoLoginEnabled });
}
