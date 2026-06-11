import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { corsair } = await import('@/lib/corsair');
    const t = corsair.withTenant(session.user.id) as any;

    // Get the start of today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Get the end of next 7 days
    const endOfWindow = new Date();
    endOfWindow.setDate(endOfWindow.getDate() + 7);
    endOfWindow.setHours(23, 59, 59, 999);

    // Fetch from Calendar API via Corsair
    const calendarResult = await t.googlecalendar.api.events.getMany({
      calendarId: 'primary',
      timeMin: startOfDay.toISOString(),
      timeMax: endOfWindow.toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime'
    });

    const safeEvents = (calendarResult.items || []).map((event: any) => ({
      id: event.id,
      summary: event.summary,
      start: event.start,
      end: event.end,
      location: event.location,
      attendees: event.attendees ? event.attendees.map((a: any) => ({
        email: a.email,
        displayName: a.displayName
      })) : []
    }));

    return NextResponse.json({ events: safeEvents });
  } catch (error: any) {
    console.error('Failed to fetch calendar events:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch calendar events',
      details: error?.message 
    }, { status: 500 });
  }
}
