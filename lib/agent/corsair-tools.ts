import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { buildCorsairToolDefs, type CorsairToolDef } from '@corsair-dev/mcp';
import { corsair } from '@/lib/corsair';
import {
  createCalendarEventForUser,
  createScriptTenant,
  extractToolFailure,
} from '@/lib/agent/calendar-actions';
import { DEFAULT_TIMEZONE, resolveTimeZone } from '@/lib/agent/datetime';
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
    throw new Error(text || 'Tool execution failed');
  }

  try {
    const parsed = JSON.parse(text);
    const failure = extractToolFailure(parsed);
    if (failure) throw new Error(failure);
    return parsed;
  } catch (e: unknown) {
    if (e instanceof SyntaxError) return text;
    throw e;
  }
}

function zodShapeToInputSchema(shape: CorsairToolDef['shape']) {
  return z.object(shape as z.ZodRawShape);
}

function wrapHandler(
  def: CorsairToolDef,
  userId: string,
  defaultTimeZone: string,
  steps?: AgentStepEmitter
) {
  return async (args: Record<string, unknown>) => {
    const stepId = steps?.subStep(TOOL_STEP_LABELS[def.name] ?? `Running ${def.name}`);

    try {
      let result;

      if (def.name === 'run_script' && typeof args.code === 'string') {
        const tenant = createScriptTenant(userId, defaultTimeZone);
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

      const parsed = parseToolOutput(result);

      if (def.name === 'list_operations') {
        steps?.completeRunning('Operations catalog loaded');
      } else if (def.name === 'get_schema') {
        steps?.completeRunning('Schema retrieved');
      } else if (def.name === 'run_script') {
        steps?.completeRunning('Action completed');
      } else {
        steps?.completeRunning();
      }

      return parsed;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Tool execution failed';
      if (stepId) steps?.update(stepId, { status: 'error', label: msg });
      throw new Error(msg);
    }
  };
}

function createWriteTools(
  userId: string,
  defaultTimeZone: string,
  steps?: AgentStepEmitter
): ToolSet {
  return {
    create_calendar_event: tool({
      description:
        'Create a Google Calendar event. Use date + startTime + endTime in the user local timezone. Returns success only when Google confirms creation.',
      inputSchema: z.object({
        summary: z.string().describe('Event title'),
        date: z
          .string()
          .optional()
          .describe('Event date in YYYY-MM-DD or DD/MM/YYYY in user timezone'),
        startTime: z
          .string()
          .optional()
          .describe('Start time in user timezone, 24-hour HH:mm or h:mm AM/PM, e.g. 15:00'),
        endTime: z
          .string()
          .optional()
          .describe('End time in user timezone, 24-hour HH:mm or h:mm AM/PM, e.g. 16:00'),
        startDateTime: z
          .string()
          .optional()
          .describe('Alternative: start datetime in user timezone, e.g. 2026-06-16T15:00:00'),
        endDateTime: z
          .string()
          .optional()
          .describe('Alternative: end datetime in user timezone, e.g. 2026-06-16T16:00:00'),
        timeZone: z
          .string()
          .optional()
          .describe(`IANA timezone. Defaults to ${defaultTimeZone}`),
        description: z.string().optional(),
        location: z.string().optional(),
        attendees: z.array(z.string()).optional().describe('Attendee email addresses'),
      }),
      execute: async (input) => {
        const stepId = steps?.subStep('Creating calendar event');
        try {
          const event = await createCalendarEventForUser(userId, {
            ...input,
            timeZone: resolveTimeZone(input.timeZone ?? defaultTimeZone),
          });
          steps?.completeRunning(`Created "${event.summary}"`);
          return {
            success: true,
            id: event.id,
            summary: event.summary,
            htmlLink: event.htmlLink,
            start: event.start,
            end: event.end,
            timeZone: input.timeZone ?? defaultTimeZone,
          };
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Failed to create event';
          if (stepId) steps?.update(stepId, { status: 'error', label: msg });
          throw new Error(msg);
        }
      },
    }),
  };
}

/**
 * Build Vercel AI SDK tools from Corsair's MCP tool definitions.
 * Gives the agent full access to list/discover/execute any Corsair operation.
 */
export function createCorsairAgentTools(
  userId: string,
  steps?: AgentStepEmitter,
  options?: { timeZone?: string }
): ToolSet {
  const defaultTimeZone = resolveTimeZone(options?.timeZone ?? DEFAULT_TIMEZONE);
  const defs = buildCorsairToolDefs({
    corsair,
    tenantId: userId,
    setup: false,
  });

  const tools: ToolSet = {
    ...createWriteTools(userId, defaultTimeZone, steps),
  };

  for (const def of defs) {
    tools[def.name] = tool({
      description: def.description,
      inputSchema: zodShapeToInputSchema(def.shape),
      execute: wrapHandler(def, userId, defaultTimeZone, steps),
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

export function summarizeToolFailures(
  toolResults: Array<{ toolName: string; output: unknown }>
): string | null {
  const failures = toolResults
    .map((result) => {
      const failure = extractToolFailure(result.output);
      return failure ? `${result.toolName}: ${failure}` : null;
    })
    .filter((msg): msg is string => !!msg);

  if (failures.length === 0) return null;
  return failures.map((msg) => `- ${msg}`).join('\n');
}
