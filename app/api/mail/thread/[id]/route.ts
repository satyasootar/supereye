import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { emails } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: googleMessageId } = await params;
    
    // First find the email to get its threadId
    const emailResults = await db.select()
      .from(emails)
      .where(eq(emails.googleMessageId, googleMessageId))
      .limit(1);

    const initialEmail = emailResults[0];

    if (!initialEmail) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    if (!initialEmail.threadId) {
      // If for some reason it has no threadId, just return it as a single-item thread
      return NextResponse.json({ messages: [initialEmail] });
    }

    // Fetch all emails in the thread, sorted by date (oldest first)
    const threadEmails = await db.select()
      .from(emails)
      .where(eq(emails.threadId, initialEmail.threadId))
      .orderBy(asc(emails.internalDate));

    return NextResponse.json({ messages: threadEmails });
  } catch (error: any) {
    console.error('Failed to fetch thread:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch thread',
      details: error?.message 
    }, { status: 500 });
  }
}
