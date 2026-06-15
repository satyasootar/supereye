import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import {
  getTriageSummary,
  triagePendingEmailsForUser,
} from '@/lib/mail/triage';
import { getTriageModel } from '@/lib/agent/triage-model';
import { checkAiAccess } from '@/lib/billing/usage';
import { tokenErrorResponse } from '@/lib/billing/errors';

export async function GET() {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

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
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  try {
    getTriageModel();
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'AI provider not configured';
    return NextResponse.json({ error: message }, { status: 503 });
  }

  try {
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
