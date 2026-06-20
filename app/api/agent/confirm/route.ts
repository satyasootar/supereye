import { requireActiveUserSession } from '@/lib/security/api-auth';
import { AgentActionEmitter } from '@/lib/agent/stream-events';
import type { AgentStreamEvent } from '@/lib/agent/stream-events';
import { executeConfirmedDraft } from '@/lib/agent/confirm-actions';
import { resolveTimeZone } from '@/lib/agent/datetime';
import { parseJsonBody, formatZodError } from '@/lib/validation/http';
import { agentConfirmDraftSchema } from '@/lib/validation/agent';
import { addMessageToThread, getOrCreateThread } from '@/lib/agent/threads';
import { logAndConsumeAiUsage, checkAiAccessForAction } from '@/lib/billing/usage';
import { tokenErrorResponse } from '@/lib/billing/errors';
import { TokenExhaustedError } from '@/lib/billing/tokens';

export async function POST(req: Request) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const parsed = await parseJsonBody(req, agentConfirmDraftSchema);
  if ('error' in parsed) return parsed.error;

  const { to, subject, body, calendarIntent, threadId, context } = parsed.data;
  const userId = session.user.id;
  const timeZone = resolveTimeZone(context?.timeZone);

  try {
    await checkAiAccessForAction(userId, 'ai_agent_action');
  } catch (e) {
    const response = tokenErrorResponse(e);
    if (response) return response;
    throw e;
  }

  let thread;
  try {
    thread = await getOrCreateThread(userId, threadId ?? null, 'Confirmed email draft');
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Thread error';
    return new Response(JSON.stringify({ error: msg }), { status: 404 });
  }

  await addMessageToThread(thread.id, 'user', 'Confirmed and sent the email draft.');
  await addMessageToThread(
    thread.id,
    'assistant',
    calendarIntent
      ? `Email sent and calendar event "${calendarIntent.summary}" created.`
      : 'Email sent successfully.'
  );

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: AgentStreamEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      emit({ type: 'thread', threadId: thread.id });

      const actions = new AgentActionEmitter(emit);

      try {
        const result = await executeConfirmedDraft(
          userId,
          { to, subject, body, calendarIntent },
          actions,
          timeZone
        );

        await logAndConsumeAiUsage(userId, {
          feature: 'agent_confirm',
          metadata: { threadId: thread.id, hasCalendar: Boolean(calendarIntent) },
        });

        const summary = calendarIntent
          ? `Done! Your email has been sent and the calendar event **${calendarIntent.summary}** is on the books.${
              result.meetLink ? `\n\nGoogle Meet: ${result.meetLink}` : ''
            }`
          : 'Done! Your email has been sent.';

        const messageId = `msg-${Date.now()}`;
        emit({ type: 'text-start', messageId });
        for (const char of summary) {
          emit({ type: 'text-delta', delta: char });
          await new Promise((r) => setTimeout(r, 3));
        }
        emit({ type: 'text-end' });
        emit({ type: 'done' });
        controller.close();
      } catch (e: unknown) {
        const billingResponse = tokenErrorResponse(e);
        const msg =
          e instanceof TokenExhaustedError
            ? e.message
            : e instanceof Error
              ? e.message
              : 'Failed to send';
        emit({ type: 'error', error: msg });
        controller.close();
        if (billingResponse) return;
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
