import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { parseQuery } from '@/lib/validation/http';
import { notificationsQuerySchema } from '@/lib/validation/notifications';

export async function GET(req: Request) {
  try {
    const authResult = await requireActiveUserSession();
    if ('error' in authResult) return authResult.error;
    const { session } = authResult;

    const parsed = parseQuery(req.url, notificationsQuerySchema);
    if ('error' in parsed) return parsed.error;

    const { limit, page = 1 } = parsed.data;
    const offset = (page - 1) * limit;

    const notifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, session.user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ notifications: notifs });
  } catch (error: unknown) {
    console.error('Error fetching notifications:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch notifications';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
