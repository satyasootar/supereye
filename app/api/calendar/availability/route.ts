import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { getTenant } from '@/lib/corsair';
import { parseJsonBody } from '@/lib/validation/http';
import { calendarAvailabilitySchema } from '@/lib/validation/calendar';

export async function POST(req: Request) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const parsed = await parseJsonBody(req, calendarAvailabilitySchema);
  if ('error' in parsed) return parsed.error;

  try {
    const { timeMin, timeMax, items } = parsed.data;
    
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
