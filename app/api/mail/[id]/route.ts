import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emails } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { requireActiveUserSession } from '@/lib/security/api-auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  try {
    const { id } = await params;
    
    // Fetch from our local DB cache first
    const emailResults = await db.select()
      .from(emails)
      .where(
        and(
          eq(emails.userId, session.user.id),
          eq(emails.googleMessageId, id)
        )
      )
      .limit(1);

    const emailData = emailResults[0];

    if (!emailData) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    return NextResponse.json({ message: emailData });
  } catch (error: any) {
    console.error('Failed to fetch email:', error);
    return NextResponse.json({ error: 'Failed to fetch email' }, { status: 500 });
  }
}
