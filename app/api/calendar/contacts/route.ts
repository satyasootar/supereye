import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { getContactSuggestions } from '@/lib/calendar/contacts';
import { parseQuery } from '@/lib/validation/http';
import { calendarContactsQuerySchema } from '@/lib/validation/calendar';

export async function GET(req: Request) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const parsed = parseQuery(req.url, calendarContactsQuerySchema);
  if ('error' in parsed) return parsed.error;

  try {
    const contacts = await getContactSuggestions(session.user.id, parsed.data.q);
    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('Failed to fetch contact suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to load contact suggestions' },
      { status: 500 }
    );
  }
}
