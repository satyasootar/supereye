import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserUsageDashboard } from '@/lib/usage/dashboard';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
