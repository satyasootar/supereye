import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { emails } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getTenant } from '@/lib/corsair';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: emailId } = await params;
  
  try {
    const existing = await db.select().from(emails).where(
      and(
        eq(emails.googleMessageId, emailId),
        eq(emails.userId, session.user.id)
      )
    );

    if (!existing.length) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    const t = getTenant(session.user.id);

    // Gmail: Archiving means removing the 'INBOX' label
    await t.gmail.api.users.messages.modify({
      userId: 'me',
      id: emailId,
      requestBody: {
        removeLabelIds: ['INBOX'],
      },
    });

    // Update local db
    await db.update(emails)
      .set({ isArchived: true })
      .where(eq(emails.googleMessageId, emailId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to archive email:', error);
    return NextResponse.json({ error: 'Failed to archive email', details: error.message }, { status: 500 });
  }
}
