import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTenant } from '@/lib/corsair';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { timeMin, timeMax, items } = await req.json();
    
    // items is an array of objects like [{ id: 'user@example.com' }]
    
    const t = getTenant(session.user.id);
    const availability = await t.googlecalendar.api.calendar.getAvailability({
      timeMin,
      timeMax,
      items
    });

    return NextResponse.json(availability);
  } catch (error: any) {
    console.error('Failed to fetch availability:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
