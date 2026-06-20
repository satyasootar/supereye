import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { extractMeetLink } from '@/lib/calendar/meet';
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
import { inferCalendarIntentFromDraft } from '@/lib/agent/infer-calendar-intent';
import {
  listGithubPullRequestsForUser,
  listGithubReposForUser,
  listGithubIssuesForUser,
} from '@/lib/agent/github-actions';
import {
  listDriveRecentFilesForUser,
  searchDriveFilesForUser,
  toDriveActionFilesFromSummary,
} from '@/lib/agent/drive-actions';
import { createScriptTenant, getScriptHelpers } from '@/lib/agent/script-tenant';
import { DEFAULT_TIMEZONE, resolveTimeZone, getTodayInTimezone } from '@/lib/agent/datetime';
import type { AgentStepEmitter } from '@/lib/agent/stream-events';
import { AgentActionEmitter } from '@/lib/agent/stream-events';
import {
  filterAgentToolSet,
  assertRunScriptPluginAccess,
} from '@/lib/agent/scope';
import type { PluginId } from '@/lib/plugins/types';

const TOOL_STEP_LABELS: Record<string, string> = {
  list_operations: 'Discovering available operations',
  get_schema: 'Reading operation schema',
  run_script: 'Executing Corsair action',
  corsair_setup: 'Checking integration setup',
  create_calendar_event: 'Creating calendar event',
  draft_email: 'Drafting email',
  send_email: 'Sending email',
  list_github_pull_requests: 'Loading GitHub pull requests',
  list_github_repos: 'Loading GitHub repositories',
  list_github_issues: 'Loading GitHub issues',
  list_drive_recent_files: 'Browsing Google Drive',
  search_drive_files: 'Searching Google Drive',
  list_calendar_events: 'Loading calendar',
  delete_calendar_event: 'Removing event',
  clear_calendar_schedule: 'Clearing schedule',
  get_account_summary: 'Loading account & billing',
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
  actions?: AgentActionEmitter,
  connectedPlugins: PluginId[] = []
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
        assertRunScriptPluginAccess(args.code, connectedPlugins);
        const tenant = createScriptTenant(userId, defaultTimeZone);
        const { createCalendarEvent, sendEmail, listGithubPullRequests } = getScriptHelpers(
          userId,
          defaultTimeZone
        );
        const fn = new Function(
          'corsair',
          'tenant',
          'createCalendarEvent',
          'sendEmail',
          'listGithubPullRequests',
          `return (async () => { ${args.code} })()`
        );
        const output = await fn(
          corsair,
          tenant,
          createCalendarEvent,
          sendEmail,
          listGithubPullRequests
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

function createAccountTools(
  userId: string,
  steps?: AgentStepEmitter
): ToolSet {
  return {
    get_account_summary: tool({
      description:
        'Get the current user Supereye plan, subscription status, and AI token usage. Use for plan, billing, subscription, or token balance questions.',
      inputSchema: z.object({}),
      execute: async () => {
        const stepId = steps?.subStep('Loading account & billing');
        try {
          const { getAccountSummaryForAgent } = await import('@/lib/agent/account-summary');
          const summary = await getAccountSummaryForAgent(userId);
          steps?.completeRunning('Account loaded');
          return { success: true, account: summary };
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Failed to load account';
          if (stepId) steps?.update(stepId, { status: 'error', label: msg });
          throw new Error(msg);
        }
      },
    }),
  };
}

function createWriteTools(
  userId: string,
  defaultTimeZone: string,
  steps?: AgentStepEmitter,
  actions?: AgentActionEmitter,
  options?: { interactiveMode?: boolean }
): ToolSet {
  const calendarIntentSchema = z.object({
    summary: z.string(),
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    attendees: z.array(z.string()).optional(),
    addGoogleMeet: z.boolean().optional(),
    timeZone: z.string().optional(),
    description: z.string().optional(),
  });

  const tools: ToolSet = {
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
          const meetLink = extractMeetLink(event);
          return {
            success: true,
            id: event.id,
            summary: event.summary,
            htmlLink: event.htmlLink,
            meetLink,
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

          await sleep(2000);

          const sendId = actions?.start({
            type: 'email_send',
            status: 'running',
            title: 'Connecting to Gmail',
            groupId,
            payload: { phase: 'connecting', to: recipients },
          });

          await sleep(800);
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
    list_github_pull_requests: tool({
      description:
        'List GitHub pull requests for the connected user. Use for any PR status, review, or summary request. Works across all repos unless repo is specified.',
      inputSchema: z.object({
        repo: z
          .string()
          .optional()
          .describe('Optional filter: owner/repo e.g. octocat/Hello-World'),
        state: z.enum(['open', 'closed', 'all']).optional().describe('Default: open'),
        limit: z.number().int().min(1).max(50).optional().describe('Max PRs to return. Default 25'),
      }),
      execute: async (input) => {
        const stepId = steps?.subStep('Loading GitHub pull requests');
        const actionId = actions?.start({
          type: 'github_action',
          status: 'running',
          title: 'Loading pull requests',
          groupId: `gh-pr-${Date.now()}`,
          payload: { toolName: 'list_github_pull_requests' },
        });

        try {
          const result = await listGithubPullRequestsForUser(userId, input);
          const top = result.pullRequests[0];
          if (actionId && actions) {
            actions.complete(actionId, {
              title: `Found ${result.count} pull request(s)`,
              payload: top
                ? {
                    toolName: 'list_github_pull_requests',
                    repoName: top.repo,
                    prNumber: top.number,
                    prTitle: top.title,
                    prStatus: top.status,
                    branch: top.branch ?? undefined,
                  }
                : { toolName: 'list_github_pull_requests' },
            });
          }
          steps?.completeRunning(`Found ${result.count} PR(s)`);
          return result;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Failed to load pull requests';
          if (actionId && actions) actions.fail(actionId, msg);
          if (stepId) steps?.update(stepId, { status: 'error', label: msg });
          throw new Error(msg);
        }
      },
    }),
    list_github_repos: tool({
      description: 'List GitHub repositories for the connected user.',
      inputSchema: z.object({
        limit: z.number().int().min(1).max(50).optional().describe('Default 20'),
      }),
      execute: async (input) => {
        const stepId = steps?.subStep('Loading GitHub repositories');
        const actionId = actions?.start({
          type: 'github_action',
          status: 'running',
          title: 'Loading repositories',
          groupId: `gh-repos-${Date.now()}`,
          payload: { toolName: 'list_github_repos' },
        });

        try {
          const result = await listGithubReposForUser(userId, input);
          if (actionId && actions) {
            actions.complete(actionId, {
              title: `Found ${result.count} repo(s)`,
              payload: { toolName: 'list_github_repos' },
            });
          }
          steps?.completeRunning(`Found ${result.count} repo(s)`);
          return result;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Failed to load repositories';
          if (actionId && actions) actions.fail(actionId, msg);
          if (stepId) steps?.update(stepId, { status: 'error', label: msg });
          throw new Error(msg);
        }
      },
    }),
    list_github_issues: tool({
      description: 'List GitHub issues for the connected user.',
      inputSchema: z.object({
        repo: z.string().optional().describe('Optional owner/repo filter'),
        state: z.enum(['open', 'closed', 'all']).optional().describe('Default: open'),
        limit: z.number().int().min(1).max(50).optional(),
      }),
      execute: async (input) => {
        const stepId = steps?.subStep('Loading GitHub issues');
        const actionId = actions?.start({
          type: 'github_action',
          status: 'running',
          title: 'Loading issues',
          groupId: `gh-issues-${Date.now()}`,
          payload: { toolName: 'list_github_issues' },
        });

        try {
          const result = await listGithubIssuesForUser(userId, input);
          const top = result.issues[0];
          if (actionId && actions) {
            actions.complete(actionId, {
              title: `Found ${result.count} issue(s)`,
              payload: top
                ? {
                    toolName: 'list_github_issues',
                    repoName: top.repo,
                    issueNumber: top.number,
                    issueTitle: top.title,
                    issueStatus: top.state === 'closed' ? 'closed' : 'open',
                  }
                : { toolName: 'list_github_issues' },
            });
          }
          steps?.completeRunning(`Found ${result.count} issue(s)`);
          return result;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Failed to load issues';
          if (actionId && actions) actions.fail(actionId, msg);
          if (stepId) steps?.update(stepId, { status: 'error', label: msg });
          throw new Error(msg);
        }
      },
    }),
    list_drive_recent_files: tool({
      description:
        'List recently modified files in Google Drive for the connected user. Use before emailing a Drive link or when user asks for recent documents.',
      inputSchema: z.object({
        limit: z.number().int().min(1).max(30).optional().describe('Default 10'),
        filesOnly: z.boolean().optional().describe('Exclude folders. Default true'),
      }),
      execute: async (input) => {
        const stepId = steps?.subStep('Browsing Google Drive');
        const groupId = `drive-${Date.now()}`;
        const actionId = actions?.start({
          type: 'drive_action',
          status: 'running',
          title: 'Finding recent files',
          groupId,
          payload: { toolName: 'list_drive_recent_files', driveAction: 'browse' },
        });

        try {
          const result = await listDriveRecentFilesForUser(userId, input);
          const top = result.mostRecent;
          const displayFiles = result.files.slice(0, 5);

          if (actionId && actions) {
            actions.complete(actionId, {
              title: top
                ? `Found ${result.count} file(s) · latest: ${top.name}`
                : `Found ${result.count} file(s)`,
              payload: {
                toolName: 'list_drive_recent_files',
                driveAction: 'browse',
                files: toDriveActionFilesFromSummary(displayFiles),
                fileName: top?.name,
                fileType: top?.mimeType,
                webViewLink: top?.url ?? undefined,
              },
            });
          }

          steps?.completeRunning(top ? `Latest file: ${top.name}` : 'Drive browse complete');
          return result;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Failed to browse Drive';
          if (actionId && actions) actions.fail(actionId, msg);
          if (stepId) steps?.update(stepId, { status: 'error', label: msg });
          throw new Error(msg);
        }
      },
    }),
    search_drive_files: tool({
      description: 'Search Google Drive files by name for the connected user.',
      inputSchema: z.object({
        query: z.string().min(1).describe('Search term, e.g. meeting notes'),
        limit: z.number().int().min(1).max(30).optional(),
      }),
      execute: async (input) => {
        const stepId = steps?.subStep('Searching Google Drive');
        const actionId = actions?.start({
          type: 'drive_action',
          status: 'running',
          title: 'Searching Drive',
          groupId: `drive-search-${Date.now()}`,
          payload: { toolName: 'search_drive_files', driveAction: 'browse' },
        });

        try {
          const result = await searchDriveFilesForUser(userId, input);
          const top = result.mostRecent;
          const displayFiles = result.files.slice(0, 5);

          if (actionId && actions) {
            actions.complete(actionId, {
              title: top
                ? `Found ${result.count} match(es) · top: ${top.name}`
                : `No files matched "${input.query}"`,
              payload: {
                toolName: 'search_drive_files',
                driveAction: 'browse',
                files: toDriveActionFilesFromSummary(displayFiles),
                fileName: top?.name,
                fileType: top?.mimeType,
                webViewLink: top?.url ?? undefined,
              },
            });
          }

          steps?.completeRunning(`Found ${result.count} file(s)`);
          return result;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Drive search failed';
          if (actionId && actions) actions.fail(actionId, msg);
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

  if (options?.interactiveMode) {
    tools.draft_email = tool({
      description:
        'Compose an email draft for user review in guided mode. Does NOT send. Include calendarIntent when user also wants a calendar event.',
      inputSchema: z.object({
        to: z.union([z.string(), z.array(z.string())]),
        subject: z.string(),
        body: z.string(),
        calendarIntent: calendarIntentSchema.optional(),
      }),
      execute: async (input) => {
        const stepId = steps?.subStep('Drafting email for review');
        const groupId = `email-${Date.now()}`;
        const recipients = Array.isArray(input.to)
          ? input.to.map(normalizeEmailAddress)
          : [normalizeEmailAddress(input.to)];

        const resolvedCalendar = inferCalendarIntentFromDraft(
          {
            subject: input.subject,
            body: input.body,
            to: recipients,
            calendarIntent: input.calendarIntent,
          },
          defaultTimeZone
        );

        const draftId = actions?.start({
          type: 'email_draft',
          status: 'running',
          title: 'Composing email',
          groupId,
          payload: {
            phase: 'drafting',
            to: recipients,
            subject: input.subject,
            body: input.body,
            calendarIntent: resolvedCalendar,
          },
        });

        let calActionId: string | undefined;
        if (resolvedCalendar) {
          calActionId = actions?.start({
            type: 'calendar_schedule',
            status: 'running',
            title: 'Previewing event',
            groupId,
            payload: {
              phase: 'preview',
              date: resolvedCalendar.date,
              startTime: resolvedCalendar.startTime,
              endTime: resolvedCalendar.endTime,
              summary: resolvedCalendar.summary,
              attendees: resolvedCalendar.attendees ?? recipients,
              timeZone: resolvedCalendar.timeZone ?? defaultTimeZone,
            },
          });
        }

        await sleep(2000);

        if (draftId && actions) {
          actions.complete(draftId, {
            title: 'Awaiting your review',
            payload: {
              phase: 'awaiting_review',
              to: recipients,
              subject: input.subject,
              body: input.body,
              calendarIntent: resolvedCalendar,
            },
          });
        }

        if (calActionId && actions && resolvedCalendar) {
          actions.complete(calActionId, {
            title: 'Event ready to schedule',
            payload: {
              phase: 'awaiting_review',
              date: resolvedCalendar.date,
              startTime: resolvedCalendar.startTime,
              endTime: resolvedCalendar.endTime,
              summary: resolvedCalendar.summary,
              attendees: resolvedCalendar.attendees ?? recipients,
              timeZone: resolvedCalendar.timeZone ?? defaultTimeZone,
            },
          });
        }

        steps?.completeRunning('Draft ready for review');
        return {
          success: true,
          awaitingConfirmation: true,
          groupId,
          draft: {
            to: recipients,
            subject: input.subject,
            body: input.body,
          },
          calendarIntent: resolvedCalendar ?? null,
        };
      },
    });
  }

  return tools;
}

/**
 * Build Vercel AI SDK tools from Corsair's MCP tool definitions.
 * Gives the agent full access to list/discover/execute any Corsair operation.
 */
export function createCorsairAgentTools(
  userId: string,
  steps?: AgentStepEmitter,
  options?: {
    timeZone?: string;
    actions?: AgentActionEmitter;
    interactiveMode?: boolean;
    connectedPlugins?: PluginId[];
  }
): ToolSet {
  const defaultTimeZone = resolveTimeZone(options?.timeZone ?? DEFAULT_TIMEZONE);
  const connectedPlugins = options?.connectedPlugins ?? [];
  const defs = buildCorsairToolDefs({
    corsair,
    tenantId: userId,
    setup: false,
  });

  const tools: ToolSet = {
    ...createAccountTools(userId, steps),
    ...createWriteTools(userId, defaultTimeZone, steps, options?.actions, {
      interactiveMode: options?.interactiveMode,
    }),
  };

  for (const def of defs) {
    tools[def.name] = tool({
      description: def.description,
      inputSchema: zodShapeToInputSchema(def.shape),
      execute: wrapHandler(
        def,
        userId,
        defaultTimeZone,
        steps,
        options?.actions,
        connectedPlugins
      ),
    });
  }

  return filterAgentToolSet(tools, connectedPlugins, options?.interactiveMode) as ToolSet;
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
