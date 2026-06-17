import { getTenant } from '@/lib/corsair';
import {
  createCalendarEventForUser,
  createCalendarEventFromRawParams,
  deleteCalendarEventFromRawParams,
  listCalendarEventsForUser,
  deleteCalendarEventForUser,
  clearCalendarScheduleForUser,
  type CreateCalendarEventInput,
} from '@/lib/agent/calendar-actions';
import { sendEmailForUser, sendEmailFromRawParams } from '@/lib/agent/mail-actions';
import {
  listGithubPullRequestsForUser,
  listGithubReposForUser,
  listGithubIssuesForUser,
} from '@/lib/agent/github-actions';

type RawCreateParams = {
  calendarId?: string;
  event?: Record<string, unknown>;
  resource?: Record<string, unknown>;
};

type RawSendParams = {
  userId?: string;
  raw?: string;
  to?: string | string[];
  subject?: string;
  body?: string;
  text?: string;
  message?: { raw?: string };
};

type RawDeleteParams = {
  calendarId?: string;
  id?: string;
  eventId?: string;
};

export function createScriptTenant(userId: string, defaultTimeZone?: string) {
  const tenant = getTenant(userId);
  const eventsApi = tenant.googlecalendar.api.events;
  const messagesApi = tenant.gmail.api.messages;

  return {
    ...tenant,
    gmail: {
      ...tenant.gmail,
      api: {
        ...tenant.gmail.api,
        messages: {
          ...messagesApi,
          send: (params: RawSendParams) => sendEmailFromRawParams(userId, params),
        },
      },
    },
    googlecalendar: {
      ...tenant.googlecalendar,
      api: {
        ...tenant.googlecalendar.api,
        events: {
          ...eventsApi,
          create: (params: RawCreateParams) =>
            createCalendarEventFromRawParams(userId, params, defaultTimeZone),
          delete: (params: RawDeleteParams) =>
            deleteCalendarEventFromRawParams(userId, params),
        },
      },
    },
  };
}

export function getScriptHelpers(userId: string, defaultTimeZone?: string) {
  const tz = defaultTimeZone;
  return {
    createCalendarEvent: (params: CreateCalendarEventInput) =>
      createCalendarEventForUser(userId, params),
    sendEmail: (params: { to: string | string[]; subject: string; body: string }) =>
      sendEmailForUser(userId, params),
    listCalendarEvents: (params?: { date?: string; timeZone?: string }) =>
      listCalendarEventsForUser(userId, { ...params, timeZone: params?.timeZone ?? tz }),
    deleteCalendarEvent: (googleEventId: string) =>
      deleteCalendarEventForUser(userId, googleEventId),
    clearCalendarSchedule: (params?: { date?: string; timeZone?: string }) =>
      clearCalendarScheduleForUser(userId, { ...params, timeZone: params?.timeZone ?? tz }),
    listGithubPullRequests: (params?: {
      repo?: string;
      state?: 'open' | 'closed' | 'all';
      limit?: number;
    }) => listGithubPullRequestsForUser(userId, params),
    listGithubRepos: (params?: { limit?: number }) =>
      listGithubReposForUser(userId, params),
    listGithubIssues: (params?: {
      repo?: string;
      state?: 'open' | 'closed' | 'all';
      limit?: number;
    }) => listGithubIssuesForUser(userId, params),
  };
}
