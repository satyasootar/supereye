import { streamText, stepCountIs, generateText } from 'ai';
import { auth } from '@/lib/auth';
import { AgentStepEmitter } from '@/lib/agent/stream-events';
import type { AgentStreamEvent } from '@/lib/agent/stream-events';
import { createCorsairAgentTools, getToolStepLabel, formatAgentError, summarizeToolFailures } from '@/lib/agent/corsair-tools';
import { getAgentModel, getAgentProviderLabel, assertAgentConfigured } from '@/lib/agent/model';
import { buildAgentSystemPrompt } from '@/lib/agent/system-prompt';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

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
  const { messages, context } = await req.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'Messages required' }), { status: 400 });
  }

  const encoder = new TextEncoder();
  const model = getAgentModel();
  const providerLabel = getAgentProviderLabel();

  const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === 'user');
  const prompt = lastUserMessage?.content ?? messages[messages.length - 1]?.content;

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: AgentStreamEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      const steps = new AgentStepEmitter(emit);

      try {
        steps.push('Connected to assistant', 'done');
        steps.push('Loading Corsair integration tools', 'running');

        const agentTools = createCorsairAgentTools(userId, steps, {
          timeZone: context?.timeZone,
        });
        steps.completeRunning(`Corsair tools ready (${Object.keys(agentTools).length})`);

        steps.push('Analyzing your request', 'running');

        const result = streamText({
          model,
          tools: agentTools,
          stopWhen: stepCountIs(10),
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
          messages: messages.map((m: { role: string; content: string }) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
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
            prompt: `The user asked: "${prompt}"\n\nHere is the data from Corsair tools:\n\n${contextData}\n\nRules:
- If any tool output contains "error" or success is false, say the action FAILED and include the error. Never claim success unless create_calendar_event returned success:true with an id.
- Otherwise provide a clear, helpful summary using markdown lists where appropriate.`,
          });

          fullText = summary.text;
          steps.completeRunning('Summary ready');
        } else {
          steps.completeRunning('Response ready');
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
