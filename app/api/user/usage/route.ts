import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { getUserUsageDashboard } from '@/lib/usage/dashboard';

export async function GET() {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  try {
    const dashboard = await getUserUsageDashboard(session.user.id);
    return NextResponse.json(dashboard);
  } catch (error: unknown) {
    console.error('Failed to fetch usage dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage dashboard' },
      { status: 500 }
    );
  }
}
