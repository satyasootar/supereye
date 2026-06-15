import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getTriageSummary,
  triagePendingEmailsForUser,
} from '@/lib/mail/triage';
import { getTriageModel } from '@/lib/agent/triage-model';
import { checkAiAccess } from '@/lib/billing/usage';
import { requireActiveUser } from '@/lib/billing/rbac';
import { tokenErrorResponse } from '@/lib/billing/errors';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const summary = await getTriageSummary(session.user.id);
    return NextResponse.json(summary);
  } catch (error: unknown) {
    console.error('Failed to fetch triage summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch triage summary' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    getTriageModel();
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'AI provider not configured';
    return NextResponse.json({ error: message }, { status: 503 });
  }

  try {
    await requireActiveUser(session.user.id);
    await checkAiAccess(session.user.id);
  } catch (e) {
    const response = tokenErrorResponse(e);
    if (response) return response;
    throw e;
  }

  const body = await req.json().catch(() => ({}));
  const limit =
    typeof body.limit === 'number' && body.limit > 0 && body.limit <= 20
      ? body.limit
      : 10;

  try {
    const result = await triagePendingEmailsForUser(session.user.id, limit);
    const summary = await getTriageSummary(session.user.id);
    return NextResponse.json({ ...result, ...summary });
  } catch (error: unknown) {
    console.error('Failed to triage emails:', error);
    return NextResponse.json({ error: 'Failed to triage emails' }, { status: 500 });
  }
}
