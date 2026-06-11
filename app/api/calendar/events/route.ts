import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { corsair } from '@/lib/corsair';

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const t = corsair.withTenant(session.user.id) as any;

    // Get the start of today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Get the end of today
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch from Calendar API via Corsair
    const calendarResult = await t.googlecalendar.api.events.getMany({
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime'
    });

    return NextResponse.json({ events: calendarResult.items || [] });
  } catch (error: any) {
    console.error('Failed to fetch calendar events:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch calendar events',
      details: error?.message 
    }, { status: 500 });
  }
}
