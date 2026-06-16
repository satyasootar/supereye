import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { db } from '@/lib/db';
import { emailTemplates } from '@/lib/db/schema';
import { parseJsonBody } from '@/lib/validation/http';
import { mailTemplateUpdateSchema } from '@/lib/validation/mail';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;
  const { id } = await params;

  const parsed = await parseJsonBody(req, mailTemplateUpdateSchema);
  if ('error' in parsed) return parsed.error;

  const [updated] = await db
    .update(emailTemplates)
    .set({
      ...parsed.data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(emailTemplates.id, id),
        eq(emailTemplates.userId, session.user.id),
        eq(emailTemplates.isPredefined, false)
      )
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  return NextResponse.json({ template: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;
  const { id } = await params;

  const [deleted] = await db
    .delete(emailTemplates)
    .where(
      and(
        eq(emailTemplates.id, id),
        eq(emailTemplates.userId, session.user.id),
        eq(emailTemplates.isPredefined, false)
      )
    )
    .returning({ id: emailTemplates.id });

  if (!deleted) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
