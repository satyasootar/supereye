import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { checkAiAccess, logAndConsumeAiUsage } from '@/lib/billing/usage';
import { tokenErrorResponse } from '@/lib/billing/errors';
import { parseJsonBody } from '@/lib/validation/http';
import { mailEnhanceSchema } from '@/lib/validation/mail';
import { getTriageModel } from '@/lib/agent/triage-model';

const TONE_HINT: Record<string, string> = {
  professional: 'clear, polished, and business-appropriate',
  friendly: 'warm, approachable, and conversational',
  formal: 'highly formal and respectful',
  persuasive: 'convincing with clear value framing and CTA',
  concise: 'short, direct, and to the point',
  empathetic: 'supportive, understanding, and human',
};

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

  const parsed = await parseJsonBody(req, mailEnhanceSchema);
  if ('error' in parsed) return parsed.error;

  const { draft, tone, isHtml, subject } = parsed.data;

  const prompt = `Rewrite the email draft using a ${tone} tone (${TONE_HINT[tone]}).
Keep intent and key facts intact. Do not invent details.
${subject ? `Subject: ${subject}` : ''}
${isHtml ? 'Return only valid HTML body content.' : 'Return plain text only.'}

Draft:
${draft}`;

  try {
    const { text, usage } = await generateText({
      model: getTriageModel(),
      prompt,
      temperature: 0.6,
    });

    void logAndConsumeAiUsage(session.user.id, {
      feature: 'email_compose_enhance',
      usage: usage as {
        inputTokens?: number;
        outputTokens?: number;
        totalTokens?: number;
      },
      metadata: { tone, isHtml },
    });

    return NextResponse.json({ enhanced: text.trim() });
  } catch (error) {
    console.error('[mail-enhance] failed:', error);
    return NextResponse.json({ error: 'Failed to enhance draft' }, { status: 500 });
  }
}
