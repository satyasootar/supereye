import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { db } from '@/lib/db';
import { emails } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET() {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  try {
    const userId = session.user.id;
    
    // Create query helper for different labels
    const getCountForLabel = async (label: string | null) => {
      let condition = and(eq(emails.userId, userId), eq(emails.isRead, false));
      if (label) {
        const categoryFilter = JSON.stringify([label]);
        condition = and(condition, sql`(${emails.labelIds} @> ${categoryFilter}::jsonb)`);
      }
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(emails)
        .where(condition);
      return Number(result[0]?.count || 0);
    };

    const [all, inbox, promotions, social, updates] = await Promise.all([
      getCountForLabel(null), // ALL
      getCountForLabel('INBOX'),
      getCountForLabel('CATEGORY_PROMOTIONS'),
      getCountForLabel('CATEGORY_SOCIAL'),
      getCountForLabel('CATEGORY_UPDATES'),
    ]);
    
    return NextResponse.json({ 
      count: inbox, // backwards compatibility for sidebar
      categories: {
        ALL: all,
        INBOX: inbox,
        CATEGORY_PROMOTIONS: promotions,
        CATEGORY_SOCIAL: social,
        CATEGORY_UPDATES: updates
      }
    });
  } catch (error) {
    console.error('Failed to fetch unread count:', error);
    return NextResponse.json({ count: 0 });
  }
}
