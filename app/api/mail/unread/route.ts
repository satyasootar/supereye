import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { emails } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ count: 0 });

  try {
    // Only count unread INBOX items
    const categoryFilter = JSON.stringify(['INBOX']);
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(
        and(
          eq(emails.userId, session.user.id),
          eq(emails.isRead, false),
          sql`(${emails.labelIds} @> ${categoryFilter}::jsonb OR ${emails.labelIds} IS NULL)`
        )
      );
    
    return NextResponse.json({ count: Number(result[0]?.count || 0) });
  } catch (error) {
    console.error('Failed to fetch unread count:', error);
    return NextResponse.json({ count: 0 });
  }
}
