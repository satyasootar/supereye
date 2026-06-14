import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { buildCorsairToolDefs, type CorsairToolDef } from '@corsair-dev/mcp';
import { corsair } from '@/lib/corsair';
import {
  createCalendarEventForUser,
  listCalendarEventsForUser,
  deleteCalendarEventForUser,
  clearCalendarScheduleForUser,
  extractToolFailure,
} from '@/lib/agent/calendar-actions';
import { sendEmailForUser, normalizeEmailAddress } from '@/lib/agent/mail-actions';
import { createScriptTenant, getScriptHelpers } from '@/lib/agent/script-tenant';
import { DEFAULT_TIMEZONE, resolveTimeZone, getTodayInTimezone } from '@/lib/agent/datetime';
import type { AgentStepEmitter } from '@/lib/agent/stream-events';
import { AgentActionEmitter } from '@/lib/agent/stream-events';

const TOOL_STEP_LABELS: Record<string, string> = {
  list_operations: 'Discovering available operations',
  get_schema: 'Reading operation schema',
  run_script: 'Executing Corsair action',
  corsair_setup: 'Checking integration setup',
  create_calendar_event: 'Creating calendar event',
  send_email: 'Sending email',
  list_calendar_events: 'Loading calendar',
  delete_calendar_event: 'Removing event',
  clear_calendar_schedule: 'Clearing schedule',
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
  steps?: AgentStepEmitter,
  actions?: AgentActionEmitter
) {
  return async (args: Record<string, unknown>) => {
    const stepId = steps?.subStep(TOOL_STEP_LABELS[def.name] ?? `Running ${def.name}`);
    const genericId =
      def.name !== 'run_script' &&
      def.name !== 'list_operations' &&
      def.name !== 'get_schema' &&
      def.name !== 'corsair_setup'
        ? actions?.start({
            type: 'generic',
            status: 'running',
            title: TOOL_STEP_LABELS[def.name] ?? def.name,
            payload: { toolName: def.name },
          })
        : undefined;

    try {
      let result;

      if (def.name === 'run_script' && typeof args.code === 'string') {
        const tenant = createScriptTenant(userId, defaultTimeZone);
        const { createCalendarEvent, sendEmail } = getScriptHelpers(userId, defaultTimeZone);
        const fn = new Function(
          'corsair',
          'tenant',
          'createCalendarEvent',
          'sendEmail',
          `return (async () => { ${args.code} })()`
        );
        const output = await fn(corsair, tenant, createCalendarEvent, sendEmail);
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

      if (genericId && actions) {
        actions.complete(genericId, { title: 'Done' });
      }

      return parsed;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Tool execution failed';
      if (genericId && actions) actions.fail(genericId, msg);
      if (stepId) steps?.update(stepId, { status: 'error', label: msg });
      throw new Error(msg);
    }
  };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function createWriteTools(
  userId: string,
  defaultTimeZone: string,
  steps?: AgentStepEmitter,
  actions?: AgentActionEmitter
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
        addGoogleMeet: z
          .boolean()
          .optional()
          .describe('Add a Google Meet video link to the event'),
      }),
      execute: async (input) => {
        const stepId = steps?.subStep('Creating calendar event');
        const tz = resolveTimeZone(input.timeZone ?? defaultTimeZone);
        const groupId = `cal-${Date.now()}`;
        const actionId = actions?.start({
          type: 'calendar_schedule',
          status: 'running',
          title: 'Opening calendar',
          groupId,
          payload: {
            phase: 'opening',
            date: input.date,
            startTime: input.startTime,
            endTime: input.endTime,
            summary: input.summary,
            attendees: input.attendees,
            timeZone: tz,
          },
        });

        try {
          const event = await createCalendarEventForUser(userId, {
            ...input,
            timeZone: tz,
          });
          if (actionId && actions) {
            actions.complete(actionId, {
              title: 'Event saved',
              payload: {
                phase: 'saved',
                date: input.date,
                startTime: input.startTime,
                endTime: input.endTime,
                summary: event.summary ?? input.summary,
                attendees: input.attendees,
                timeZone: tz,
              },
            });
          }
          steps?.completeRunning(`Created "${event.summary}"`);
          return {
            success: true,
            id: event.id,
            summary: event.summary,
            htmlLink: event.htmlLink,
            start: event.start,
            end: event.end,
            timeZone: tz,
          };
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Failed to create event';
          if (actionId && actions) actions.fail(actionId, msg);
          if (stepId) steps?.update(stepId, { status: 'error', label: msg });
          throw new Error(msg);
        }
      },
    }),
    send_email: tool({
      description:
        'Send an email via Gmail. Use for any outbound email. Requires full recipient address from the user request.',
      inputSchema: z.object({
        to: z
          .union([z.string(), z.array(z.string())])
          .describe('Recipient email(s). Use exact address from user, e.g. satya.sootar06@gmail.com'),
        subject: z.string().describe('Email subject'),
        body: z.string().describe('Plain-text email body'),
      }),
      execute: async (input) => {
        const stepId = steps?.subStep('Sending email');
        const groupId = `email-${Date.now()}`;
        try {
          const recipients = Array.isArray(input.to)
            ? input.to.map(normalizeEmailAddress)
            : [normalizeEmailAddress(input.to)];

          const draftId = actions?.start({
            type: 'email_draft',
            status: 'running',
            title: 'Drafting email',
            groupId,
            payload: {
              phase: 'drafting',
              to: recipients,
              subject: input.subject,
              body: input.body,
            },
          });

          await sleep(1200);

          const sendId = actions?.start({
            type: 'email_send',
            status: 'running',
            title: 'Connecting to Gmail',
            groupId,
            payload: { phase: 'connecting', to: recipients },
          });

          await sleep(500);
          if (sendId && actions) {
            actions.update(sendId, {
              title: 'Sending message',
              payload: { phase: 'sending', to: recipients },
            });
          }

          const result = await sendEmailForUser(userId, {
            to: recipients,
            subject: input.subject,
            body: input.body,
          });

          if (draftId && actions) {
            actions.complete(draftId, {
              title: 'Draft complete',
              payload: { phase: 'complete', to: recipients, subject: input.subject, body: input.body },
            });
          }
          if (sendId && actions) {
            actions.complete(sendId, {
              title: 'Email sent successfully',
              payload: { phase: 'sent', to: recipients },
            });
          }

          steps?.completeRunning(`Email sent to ${recipients.join(', ')}`);
          return result;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Failed to send email';
          if (stepId) steps?.update(stepId, { status: 'error', label: msg });
          throw new Error(msg);
        }
      },
    }),
    list_calendar_events: tool({
      description:
        'List calendar events for a specific day from live Google Calendar. Returns Google event ids needed for delete.',
      inputSchema: z.object({
        date: z
          .string()
          .optional()
          .describe('Date YYYY-MM-DD or DD/MM/YYYY in user timezone. Defaults to today.'),
        timeZone: z.string().optional().describe(`Defaults to ${defaultTimeZone}`),
      }),
      execute: async (input) => {
        steps?.subStep('Loading calendar events');
        const result = await listCalendarEventsForUser(userId, {
          date: input.date,
          timeZone: resolveTimeZone(input.timeZone ?? defaultTimeZone),
        });
        steps?.completeRunning(`Found ${result.events.length} event(s)`);
        return result;
      },
    }),
    delete_calendar_event: tool({
      description:
        'Delete a single calendar event by Google event id from list_calendar_events.',
      inputSchema: z.object({
        googleEventId: z.string().describe('The id field from list_calendar_events'),
      }),
      execute: async (input) => {
        const stepId = steps?.subStep('Removing calendar event');
        try {
          const result = await deleteCalendarEventForUser(userId, input.googleEventId);
          steps?.completeRunning('Event removed');
          return result;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Failed to delete event';
          if (stepId) steps?.update(stepId, { status: 'error', label: msg });
          throw new Error(msg);
        }
      },
    }),
    clear_calendar_schedule: tool({
      description:
        'Delete ALL events on a day. Use when user asks to clear schedule for today or a specific date.',
      inputSchema: z.object({
        date: z
          .string()
          .optional()
          .describe('Date to clear. Defaults to today in user timezone.'),
        timeZone: z.string().optional().describe(`Defaults to ${defaultTimeZone}`),
      }),
      execute: async (input) => {
        const tz = resolveTimeZone(input.timeZone ?? defaultTimeZone);
        const date = input.date ?? getTodayInTimezone(tz);
        const stepId = steps?.subStep('Clearing schedule');
        const actionId = actions?.start({
          type: 'calendar_schedule',
          status: 'running',
          title: 'Clearing schedule',
          groupId: `clear-${Date.now()}`,
          payload: { phase: 'clearing', date, timeZone: tz, summary: 'Clearing all events' },
        });

        try {
          const result = await clearCalendarScheduleForUser(userId, {
            date: input.date,
            timeZone: tz,
          });
          if (actionId && actions) {
            actions.complete(actionId, {
              title: `Cleared ${result.deleted.length + result.alreadyGone.length} event(s)`,
              payload: {
                phase: 'saved',
                date: result.date,
                timeZone: result.timeZone,
                summary: 'Schedule cleared',
              },
            });
          }
          steps?.completeRunning('Schedule cleared');
          return result;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Failed to clear schedule';
          if (actionId && actions) actions.fail(actionId, msg);
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
  options?: { timeZone?: string; actions?: AgentActionEmitter }
): ToolSet {
  const defaultTimeZone = resolveTimeZone(options?.timeZone ?? DEFAULT_TIMEZONE);
  const defs = buildCorsairToolDefs({
    corsair,
    tenantId: userId,
    setup: false,
  });

  const tools: ToolSet = {
    ...createWriteTools(userId, defaultTimeZone, steps, options?.actions),
  };

  for (const def of defs) {
    tools[def.name] = tool({
      description: def.description,
      inputSchema: zodShapeToInputSchema(def.shape),
      execute: wrapHandler(def, userId, defaultTimeZone, steps, options?.actions),
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
