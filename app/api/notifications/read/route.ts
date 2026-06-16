import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { parseJsonBody } from '@/lib/validation/http';
import { notificationReadSchema } from '@/lib/validation/notifications';

export async function POST(req: Request) {
  try {
    const authResult = await requireActiveUserSession();
    if ('error' in authResult) return authResult.error;
    const { session } = authResult;

    const parsed = await parseJsonBody(req, notificationReadSchema);
    if ('error' in parsed) return parsed.error;

    if ('markAll' in parsed.data) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, session.user.id));
    } else {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.id, parsed.data.id),
            eq(notifications.userId, session.user.id)
          )
        );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error updating notification:', error);
    const message = error instanceof Error ? error.message : 'Failed to update notification';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
