import { NextResponse } from 'next/server';
import { generateText, tool, stepCountIs } from 'ai';
import { createMistral } from '@ai-sdk/mistral';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { getTenant } from '@/lib/corsair';

export type AgentStepPayload = {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
};

function pushStep(steps: AgentStepPayload[], label: string, status: AgentStepPayload['status'] = 'running') {
  const id = `step-${steps.length}`;
  steps.push({ id, label, status });
  return id;
}

function markDone(steps: AgentStepPayload[], label: string) {
  const running = steps.find((s) => s.status === 'running');
  if (running) running.status = 'done';
  pushStep(steps, label, 'done');
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.MISTRAL_API_KEY) {
    return NextResponse.json(
      { error: 'MISTRAL_API_KEY is not configured' },
      { status: 503 }
    );
  }

  const userId = session.user.id;
  const { messages, context } = await req.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Messages required' }, { status: 400 });
  }

  const steps: AgentStepPayload[] = [];
  const tenant = getTenant(userId);
  const mistral = createMistral({ apiKey: process.env.MISTRAL_API_KEY });

  pushStep(steps, 'Connected to assistant', 'done');
  pushStep(steps, 'Reading context...', 'running');

  const contextSummary = context
    ? `User is viewing: ${context.contextLabel ?? 'workspace'}. Workspace mode: ${context.workspaceMode}. Folder: ${context.folder}.`
    : 'No context provided.';

  markDone(steps, 'Context loaded');

  const agentTools = {
    fetch_emails: tool({
      description: 'Fetch emails from Gmail inbox',
      inputSchema: z.object({
        limit: z.number().optional().describe('Max emails to fetch'),
        label: z.string().optional().describe('Gmail label, e.g. INBOX or UNREAD'),
      }),
      execute: async ({ limit, label }) => {
        pushStep(steps, 'Reading inbox...', 'running');
        try {
          const res = await tenant.gmail.api.messages.list({
            maxResults: limit ?? 10,
            labelIds: label ? [label] : ['INBOX'],
          });
          const ids = res.messages ?? [];
          markDone(steps, `Found ${ids.length} emails`);

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
              subject: detail.payload?.headers?.find((h: { name?: string; value?: string }) => h.name === 'Subject')?.value,
              from: detail.payload?.headers?.find((h: { name?: string; value?: string }) => h.name === 'From')?.value,
              date: detail.payload?.headers?.find((h: { name?: string; value?: string }) => h.name === 'Date')?.value,
              isUnread: detail.labelIds?.includes('UNREAD'),
            });
          }

          const unread = details.filter((d) => d.isUnread).length;
          if (unread > 0) {
            markDone(steps, `Identified ${unread} unread emails`);
          }
          return details;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Failed to fetch emails';
          pushStep(steps, msg, 'error');
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
        pushStep(steps, 'Reading calendar...', 'running');
        try {
          const res = await tenant.googlecalendar.api.events.getMany({
            calendarId: 'primary',
            maxResults: limit ?? 10,
            timeMin: new Date().toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
          });
          const items =
            res.items?.map((ev: { summary?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string }; location?: string; htmlLink?: string }) => ({
              summary: ev.summary,
              start: ev.start?.dateTime || ev.start?.date,
              end: ev.end?.dateTime || ev.end?.date,
              location: ev.location,
              link: ev.htmlLink,
            })) ?? [];
          markDone(steps, `Found ${items.length} upcoming events`);
          return items;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Failed to fetch events';
          pushStep(steps, msg, 'error');
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
        pushStep(steps, `Searching: "${query}"...`, 'running');
        try {
          const res = await tenant.gmail.api.messages.list({
            maxResults: limit ?? 10,
            q: query,
          });
          const ids = res.messages ?? [];
          markDone(steps, `Found ${ids.length} matching emails`);
          return { count: ids.length, query };
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Search failed';
          pushStep(steps, msg, 'error');
          return { error: msg };
        }
      },
    }),
  };

  const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === 'user');
  const prompt = lastUserMessage?.content ?? messages[messages.length - 1]?.content;

  pushStep(steps, 'Generating response...', 'running');

  try {
    const result = await generateText({
      model: mistral('mistral-large-latest'),
      tools: agentTools,
      stopWhen: stepCountIs(5),
      system: `You are Supereye, an AI assistant embedded in an email and calendar productivity app.
You operate directly on the user's Gmail and Google Calendar.
Be concise, helpful, and action-oriented. Use plain text, not markdown headers.
${contextSummary}
When summarizing emails, highlight urgent items and action items.
Current user name: ${context?.userName ?? 'User'}.`,
      prompt,
    });

    let finalText = result.text;

    if (!finalText.trim() && result.toolResults?.length) {
      const contextData = result.toolResults
        .map((r) => `${r.toolName}:\n${JSON.stringify(r.output, null, 2)}`)
        .join('\n\n');

      const summary = await generateText({
        model: mistral('mistral-large-latest'),
        prompt: `The user asked: "${prompt}"\n\nHere is the data fetched:\n\n${contextData}\n\nProvide a clear, concise summary.`,
      });
      finalText = summary.text;
    }

    const running = steps.find((s) => s.status === 'running');
    if (running) running.status = 'done';

    return NextResponse.json({
      text: finalText.trim() || 'I completed the task but have nothing to report.',
      steps,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Agent request failed';
    pushStep(steps, msg, 'error');
    return NextResponse.json({ error: msg, steps }, { status: 500 });
  }
}
