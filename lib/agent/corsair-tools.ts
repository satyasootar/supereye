import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { buildCorsairToolDefs, type CorsairToolDef } from '@corsair-dev/mcp';
import { corsair, getTenant } from '@/lib/corsair';
import { createCalendarEventForUser } from '@/lib/agent/calendar-actions';
import type { AgentStepEmitter } from '@/lib/agent/stream-events';

const TOOL_STEP_LABELS: Record<string, string> = {
  list_operations: 'Discovering available operations',
  get_schema: 'Reading operation schema',
  run_script: 'Executing Corsair action',
  corsair_setup: 'Checking integration setup',
  create_calendar_event: 'Creating calendar event',
};

function parseToolOutput(result: { content: { type: string; text?: string }[]; isError?: boolean }) {
  const text = result.content
    .filter((c) => c.type === 'text')
    .map((c) => ('text' in c ? c.text : ''))
    .join('\n');

  if (result.isError) {
    return { error: text };
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function zodShapeToInputSchema(shape: CorsairToolDef['shape']) {
  return z.object(shape as z.ZodRawShape);
}

function wrapHandler(
  def: CorsairToolDef,
  userId: string,
  steps?: AgentStepEmitter
) {
  return async (args: Record<string, unknown>) => {
    const stepId = steps?.subStep(TOOL_STEP_LABELS[def.name] ?? `Running ${def.name}`);

    try {
      let result;

      if (def.name === 'run_script' && typeof args.code === 'string') {
        const tenant = getTenant(userId);
        const fn = new Function(
          'corsair',
          'tenant',
          'createCalendarEvent',
          `return (async () => { ${args.code} })()`
        );
        const output = await fn(
          corsair,
          tenant,
          (params: Parameters<typeof createCalendarEventForUser>[1]) =>
            createCalendarEventForUser(userId, params)
        );
        result = {
          content: [
            { type: 'text' as const, text: JSON.stringify(output ?? null, null, 2) },
          ],
        };
      } else {
        result = await def.handler(args);
      }

      if (def.name === 'list_operations') {
        steps?.completeRunning('Operations catalog loaded');
      } else if (def.name === 'get_schema') {
        steps?.completeRunning('Schema retrieved');
      } else if (def.name === 'run_script') {
        steps?.completeRunning('Action completed');
      } else {
        steps?.completeRunning();
      }

      return parseToolOutput(result);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Tool execution failed';
      if (stepId) steps?.update(stepId, { status: 'error', label: msg });
      return { error: msg };
    }
  };
}

function createWriteTools(userId: string, steps?: AgentStepEmitter): ToolSet {
  return {
    create_calendar_event: tool({
      description:
        'Create a new Google Calendar event for the user. Use this for scheduling meetings. Prefer this over run_script for creating events.',
      inputSchema: z.object({
        summary: z.string().describe('Event title'),
        startDateTime: z.string().describe('Start time in ISO 8601, e.g. 2026-06-15T14:00:00.000Z'),
        endDateTime: z.string().describe('End time in ISO 8601'),
        description: z.string().optional(),
        location: z.string().optional(),
        attendees: z.array(z.string()).optional().describe('Attendee email addresses'),
        timeZone: z.string().optional().describe('IANA timezone, e.g. America/New_York'),
      }),
      execute: async (input) => {
        const stepId = steps?.subStep('Creating calendar event');
        try {
          const event = await createCalendarEventForUser(userId, input);
          steps?.completeRunning(`Created "${event.summary}"`);
          return {
            success: true,
            id: event.id,
            summary: event.summary,
            htmlLink: event.htmlLink,
            start: event.start,
            end: event.end,
          };
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Failed to create event';
          if (stepId) steps?.update(stepId, { status: 'error', label: msg });
          return { error: msg };
        }
      },
    }),
  };
}

/**
 * Build Vercel AI SDK tools from Corsair's MCP tool definitions.
 * Gives the agent full access to list/discover/execute any Corsair operation.
 */
export function createCorsairAgentTools(userId: string, steps?: AgentStepEmitter): ToolSet {
  const defs = buildCorsairToolDefs({
    corsair,
    tenantId: userId,
    setup: false,
  });

  const tools: ToolSet = {
    ...createWriteTools(userId, steps),
  };

  for (const def of defs) {
    tools[def.name] = tool({
      description: def.description,
      inputSchema: zodShapeToInputSchema(def.shape),
      execute: wrapHandler(def, userId, steps),
    });
  }

  return tools;
}

export function getToolStepLabel(toolName: string): string {
  return TOOL_STEP_LABELS[toolName] ?? `Running ${toolName}`;
}

function isRateLimitError(e: unknown): boolean {
  if (!e || typeof e !== 'object') return false;
  const err = e as { statusCode?: number; message?: string; lastError?: { statusCode?: number } };
  return (
    err.statusCode === 429 ||
    err.lastError?.statusCode === 429 ||
    (typeof err.message === 'string' && err.message.toLowerCase().includes('rate limit'))
  );
}

export function formatAgentError(e: unknown): string {
  if (isRateLimitError(e)) {
    return 'AI rate limit reached. Wait a minute and try again, or switch to OpenAI by setting AI_PROVIDER=openai in your environment.';
  }
  if (e instanceof Error) return e.message;
  return 'Agent request failed';
}
