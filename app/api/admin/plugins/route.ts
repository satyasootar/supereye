import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/billing/api-auth';
import { getPluginAnalytics } from '@/lib/billing/admin';

export async function GET() {
  const authResult = await requireAdminSession();
  if ('error' in authResult) return authResult.error;

  const analytics = await getPluginAnalytics();
  return NextResponse.json(analytics);
}
