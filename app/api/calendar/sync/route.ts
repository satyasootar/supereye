import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { syncCalendarForUser } from '@/lib/calendar/sync';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const result = await syncCalendarForUser(userId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Calendar sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
