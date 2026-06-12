import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTenant } from '@/lib/corsair';
import { db } from '@/lib/db';
import { emails } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const t = getTenant(session.user.id);

    // Call Corsair to move the message to Trash
    await t.gmail.api.messages.trash({ id });

    // Update local DB to reflect the change immediately
    await db.update(emails)
      .set({ 
        isArchived: true, // We treat trash as archived/hidden from main views
        updatedAt: new Date()
      })
      .where(
        and(
          eq(emails.userId, session.user.id),
          eq(emails.googleMessageId, id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to trash email:', error);
    return NextResponse.json(
      { error: 'Failed to trash email', details: error.message },
      { status: 500 }
    );
  }
}
