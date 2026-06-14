import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getContactSuggestions } from '@/lib/calendar/contacts';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
