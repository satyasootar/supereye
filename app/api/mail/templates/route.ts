import { NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { db } from '@/lib/db';
import { emailTemplates } from '@/lib/db/schema';
import { parseJsonBody } from '@/lib/validation/http';
import { mailTemplateCreateSchema } from '@/lib/validation/mail';
import { PREDEFINED_EMAIL_TEMPLATES } from '@/lib/mail/templates';

export async function GET() {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const customTemplates = await db
    .select()
    .from(emailTemplates)
    .where(
      and(
        eq(emailTemplates.userId, session.user.id),
        eq(emailTemplates.isPredefined, false)
      )
    )
    .orderBy(desc(emailTemplates.updatedAt));

  return NextResponse.json({
    templates: [
      ...PREDEFINED_EMAIL_TEMPLATES.map((t) => ({
        id: t.id,
        name: t.name,
        subject: t.subject,
        htmlContent: t.htmlContent,
        isPredefined: true,
      })),
      ...customTemplates.map((t) => ({
        id: t.id,
        name: t.name,
        subject: t.subject,
        htmlContent: t.htmlContent,
        isPredefined: false,
      })),
    ],
  });
}

export async function POST(req: Request) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const parsed = await parseJsonBody(req, mailTemplateCreateSchema);
  if ('error' in parsed) return parsed.error;

  const [created] = await db
    .insert(emailTemplates)
    .values({
      userId: session.user.id,
      name: parsed.data.name,
      subject: parsed.data.subject,
      htmlContent: parsed.data.htmlContent,
      isPredefined: false,
    })
    .returning();

  return NextResponse.json({ template: created });
}
