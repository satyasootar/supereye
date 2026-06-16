import { streamText, stepCountIs, generateText } from 'ai';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { AgentStepEmitter, AgentActionEmitter } from '@/lib/agent/stream-events';
import type { AgentStreamEvent } from '@/lib/agent/stream-events';
import {
  createCorsairAgentTools,
  getToolStepLabel,
  formatAgentError,
  summarizeToolFailures,
} from '@/lib/agent/corsair-tools';
import { getAgentModel, getAgentProviderLabel, assertAgentConfigured } from '@/lib/agent/model';
import { buildAgentSystemPrompt } from '@/lib/agent/system-prompt';
import {
  addMessageToThread,
  ensureThreadTitleFromFirstMessage,
  getOrCreateThread,
  getThreadMessages,
} from '@/lib/agent/threads';
import { logAndConsumeAiUsage, checkAiAccess } from '@/lib/billing/usage';
import { tokenErrorResponse } from '@/lib/billing/errors';
import { parseJsonBody, formatZodError } from '@/lib/validation/http';
import { agentChatSchema } from '@/lib/validation/agent';
import { z } from 'zod';

export async function POST(req: Request) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  try {
    assertAgentConfigured();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'AI provider not configured';
    return new Response(JSON.stringify({ error: msg }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userId = session.user.id;

  try {
    await checkAiAccess(userId);
  } catch (e) {
    const response = tokenErrorResponse(e);
    if (response) return response;
    throw e;
  }

  const rawBody = await req.json();
  const chatParsed = agentChatSchema
    .or(
      z.object({
        messages: z.array(
          z.object({
            role: z.string(),
            content: z.string().optional(),
          })
        ),
        threadId: z.string().uuid().nullable().optional(),
        context: agentChatSchema.shape.context,
      })
    )
    .safeParse(rawBody);

  if (!chatParsed.success) {
    return new Response(JSON.stringify({ error: formatZodError(chatParsed.error) }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = chatParsed.data;
  const { threadId: incomingThreadId, context } = body;

  const userMessage =
    'message' in body && body.message
      ? body.message.trim()
      : 'messages' in body && Array.isArray(body.messages)
        ? [...body.messages]
            .reverse()
            .find((m) => m.role === 'user' && m.content?.trim())?.content?.trim() ?? ''
        : '';

  if (!userMessage) {
    return new Response(JSON.stringify({ error: 'Message required' }), { status: 400 });
  }

  let thread;
  try {
    thread = await getOrCreateThread(userId, incomingThreadId ?? null, userMessage);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Thread error';
    return new Response(JSON.stringify({ error: msg }), { status: 404 });
  }

  await addMessageToThread(thread.id, 'user', userMessage);
  await ensureThreadTitleFromFirstMessage(thread.id, userMessage);

  const dbMessages = await getThreadMessages(thread.id);
  const messages = dbMessages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  const encoder = new TextEncoder();
  const model = getAgentModel();
  const providerLabel = getAgentProviderLabel();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: AgentStreamEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      emit({ type: 'thread', threadId: thread.id });

      const steps = new AgentStepEmitter(emit);
      const actions = new AgentActionEmitter(emit);

      try {
        steps.push('Connected to assistant', 'done');
        steps.push('Loading Corsair integration tools', 'running');

        const agentTools = createCorsairAgentTools(userId, steps, {
          timeZone: context?.timeZone,
          actions,
        });
        steps.completeRunning(`Corsair tools ready (${Object.keys(agentTools).length})`);

        steps.push('Analyzing your request', 'running');

        const result = streamText({
          model,
          tools: agentTools,
          stopWhen: stepCountIs(12),
          maxRetries: 1,
          system: buildAgentSystemPrompt({
            userName: context?.userName,
            contextLabel: context?.contextLabel,
            workspaceMode: context?.workspaceMode,
            folder: context?.folder,
            providerLabel,
            timeZone: context?.timeZone,
            nowLocal: context?.nowLocal,
            todayDate: context?.todayDate,
          }),
          messages,
          experimental_onToolCallStart: ({ toolCall }) => {
            steps.subStep(getToolStepLabel(toolCall.toolName));
          },
        });

        steps.completeRunning('Analysis complete');
        steps.push('Generating response', 'running');

        const messageId = `msg-${Date.now()}`;
        emit({ type: 'text-start', messageId });

        let streamedText = '';
        for await (const delta of result.textStream) {
          streamedText += delta;
        }

        const toolResults = await result.toolResults;
        const toolFailures = summarizeToolFailures(toolResults);

        let fullText = streamedText;

        if (toolFailures) {
          fullText = `I could not complete that action:\n\n${toolFailures}`;
          steps.push('Action failed', 'error');
        } else if (!fullText.trim() && toolResults.length > 0) {
          steps.push('Synthesizing results', 'running');

          const contextData = toolResults
            .map((r) => `${r.toolName}:\n${JSON.stringify(r.output, null, 2)}`)
            .join('\n\n');

          const summary = await generateText({
            model,
            maxRetries: 1,
            prompt: `The user asked: "${userMessage}"\n\nHere is the data from Corsair tools:\n\n${contextData}\n\nRules:
- If any tool output contains "error" or success is false, say the action FAILED and include the error.
- Never claim an email was sent unless send_email returned success:true.
- Never claim an event was created unless create_calendar_event returned success:true with an id.
- For schedule clears, use clear_calendar_schedule results (deleted/alreadyGone/failed arrays). Do not repeat the same paragraph twice.
- Keep the response concise — one short summary, no redundant troubleshooting unless something failed.
- Otherwise provide a clear, helpful summary using markdown lists where appropriate.`,
          });

          fullText = summary.text;
          steps.completeRunning('Summary ready');

          try {
            await logAndConsumeAiUsage(userId, {
              feature: 'chat_summary',
              usage: summary.usage,
              metadata: { threadId: thread.id },
            });
          } catch {
            /* usage logging is best-effort */
          }
        } else {
          steps.completeRunning('Response ready');
        }

        await addMessageToThread(thread.id, 'assistant', fullText);

        try {
          const usage = await result.usage;
          await logAndConsumeAiUsage(userId, {
            feature: 'chat',
            usage,
            metadata: { threadId: thread.id },
          });
        } catch {
          /* usage logging is best-effort */
        }

        for (const char of fullText) {
          emit({ type: 'text-delta', delta: char });
          await new Promise((r) => setTimeout(r, 2));
        }

        emit({ type: 'text-end' });
        emit({ type: 'done' });
        controller.close();
      } catch (e: unknown) {
        const msg = formatAgentError(e);
        steps.push(msg, 'error');
        emit({ type: 'error', error: msg });
        controller.close();
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
