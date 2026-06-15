import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { getContactSuggestions } from '@/lib/calendar/contacts';

export async function GET(req: Request) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';

  try {
    const contacts = await getContactSuggestions(session.user.id, q);
    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('Failed to fetch contact suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to load contact suggestions' },
      { status: 500 }
    );
  }
}
