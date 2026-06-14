import { streamText, tool, stepCountIs, generateText } from 'ai';
import { createMistral } from '@ai-sdk/mistral';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { getTenant } from '@/lib/corsair';
import { AgentStepEmitter } from '@/lib/agent/stream-events';
import type { AgentStreamEvent } from '@/lib/agent/stream-events';

const TOOL_LABELS: Record<string, string> = {
  fetch_emails: 'Fetching emails from Gmail',
  fetch_events: 'Reading calendar events',
  search_emails: 'Searching inbox',
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (!process.env.MISTRAL_API_KEY) {
    return new Response(JSON.stringify({ error: 'MISTRAL_API_KEY is not configured' }), {
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
  const tenant = getTenant(userId);
  const mistral = createMistral({ apiKey: process.env.MISTRAL_API_KEY });

  const contextSummary = context
    ? `User is viewing: ${context.contextLabel ?? 'workspace'}. Workspace mode: ${context.workspaceMode}. Folder: ${context.folder}.`
    : 'No context provided.';

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
        steps.push('Reading your context', 'running');
        steps.completeRunning('Context loaded');

        const agentTools = {
          fetch_emails: tool({
            description: 'Fetch emails from Gmail inbox',
            inputSchema: z.object({
              limit: z.number().optional().describe('Max emails to fetch'),
              label: z.string().optional().describe('Gmail label, e.g. INBOX or UNREAD'),
            }),
            execute: async ({ limit, label }) => {
              const id = steps.subStep('Connecting to Gmail');
              try {
                steps.update(id, { label: 'Fetching inbox messages...' });
                const res = await tenant.gmail.api.messages.list({
                  maxResults: limit ?? 10,
                  labelIds: label ? [label] : ['INBOX'],
                });
                const ids = res.messages ?? [];
                steps.completeRunning(`Found ${ids.length} emails`);

                steps.push('Processing email metadata...', 'running');
                const details = [];
                for (const msg of ids.slice(0, limit ?? 10)) {
                  const detail = await tenant.gmail.api.messages.get({
                    id: msg.id!,
                    format: 'metadata',
                    metadataHeaders: ['Subject', 'From', 'Date'],
                  });
                  details.push({
                    id: msg.id,
                    snippet: detail.snippet,
                    subject: detail.payload?.headers?.find(
                      (h: { name?: string; value?: string }) => h.name === 'Subject'
                    )?.value,
                    from: detail.payload?.headers?.find(
                      (h: { name?: string; value?: string }) => h.name === 'From'
                    )?.value,
                    date: detail.payload?.headers?.find(
                      (h: { name?: string; value?: string }) => h.name === 'Date'
                    )?.value,
                    isUnread: detail.labelIds?.includes('UNREAD'),
                  });
                }

                const unread = details.filter((d) => d.isUnread).length;
                if (unread > 0) {
                  steps.completeRunning(`Identified ${unread} unread emails`);
                } else {
                  steps.completeRunning('Email metadata processed');
                }
                return details;
              } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to fetch emails';
                steps.update(id, { status: 'error', label: msg });
                return { error: msg };
              }
            },
          }),

          fetch_events: tool({
            description: 'Fetch upcoming calendar events',
            inputSchema: z.object({
              limit: z.number().optional().describe('Max events to fetch'),
            }),
            execute: async ({ limit }) => {
              const id = steps.subStep('Connecting to Google Calendar');
              try {
                steps.update(id, { label: 'Loading upcoming events...' });
                const res = await tenant.googlecalendar.api.events.getMany({
                  calendarId: 'primary',
                  maxResults: limit ?? 10,
                  timeMin: new Date().toISOString(),
                  singleEvents: true,
                  orderBy: 'startTime',
                });
                const items =
                  res.items?.map(
                    (ev: {
                      summary?: string;
                      start?: { dateTime?: string; date?: string };
                      end?: { dateTime?: string; date?: string };
                      location?: string;
                      htmlLink?: string;
                    }) => ({
                      summary: ev.summary,
                      start: ev.start?.dateTime || ev.start?.date,
                      end: ev.end?.dateTime || ev.end?.date,
                      location: ev.location,
                      link: ev.htmlLink,
                    })
                  ) ?? [];
                steps.completeRunning(`Found ${items.length} upcoming events`);
                return items;
              } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to fetch events';
                steps.update(id, { status: 'error', label: msg });
                return { error: msg };
              }
            },
          }),

          search_emails: tool({
            description: 'Search emails by query string',
            inputSchema: z.object({
              query: z.string().describe('Gmail search query'),
              limit: z.number().optional(),
            }),
            execute: async ({ query, limit }) => {
              const id = steps.subStep(`Searching: "${query}"`);
              try {
                const res = await tenant.gmail.api.messages.list({
                  maxResults: limit ?? 10,
                  q: query,
                });
                const ids = res.messages ?? [];
                steps.completeRunning(`Found ${ids.length} matching emails`);
                return { count: ids.length, query };
              } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Search failed';
                steps.update(id, { status: 'error', label: msg });
                return { error: msg };
              }
            },
          }),
        };

        steps.push('Analyzing your request', 'running');

        const result = streamText({
          model: mistral('mistral-large-latest'),
          tools: agentTools,
          stopWhen: stepCountIs(5),
          system: `You are Supereye, an AI assistant embedded in an email and calendar productivity app.
You operate directly on the user's Gmail and Google Calendar.
Be concise, helpful, and action-oriented. Use markdown lists when summarizing multiple items.
${contextSummary}
When summarizing emails, highlight urgent items and action items.
Current user name: ${context?.userName ?? 'User'}.`,
          messages: messages.map((m: { role: string; content: string }) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
          experimental_onToolCallStart: ({ toolCall }) => {
            const label = TOOL_LABELS[toolCall.toolName] ?? `Running ${toolCall.toolName}`;
            steps.subStep(label);
          },
          experimental_onToolCallFinish: () => {
            steps.completeRunning();
          },
        });

        steps.completeRunning('Analysis complete');
        steps.push('Generating response', 'running');

        const messageId = `msg-${Date.now()}`;
        emit({ type: 'text-start', messageId });

        let fullText = '';
        for await (const delta of result.textStream) {
          fullText += delta;
          emit({ type: 'text-delta', delta });
        }

        if (!fullText.trim()) {
          const toolResults = await result.toolResults;
          if (toolResults.length > 0) {
            steps.push('Synthesizing results', 'running');

            const contextData = toolResults
              .map((r) => `${r.toolName}:\n${JSON.stringify(r.output, null, 2)}`)
              .join('\n\n');

            const summary = await generateText({
              model: mistral('mistral-large-latest'),
              prompt: `The user asked: "${prompt}"\n\nHere is the data fetched:\n\n${contextData}\n\nProvide a clear, concise summary using markdown lists where helpful.`,
            });

            fullText = summary.text;
            for (const char of fullText) {
              emit({ type: 'text-delta', delta: char });
              await new Promise((r) => setTimeout(r, 8));
            }
            steps.completeRunning('Summary ready');
          }
        } else {
          steps.completeRunning('Response ready');
        }

        emit({ type: 'text-end' });
        emit({ type: 'done' });
        controller.close();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Agent request failed';
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
