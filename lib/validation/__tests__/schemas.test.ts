import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  emailSchema,
  recipientsSchema,
  paginationQuerySchema,
  futureIsoDateTimeSchema,
  googleMessageIdSchema,
} from '../common.ts';
import {
  mailSendFieldsSchema,
  mailReplyFieldsSchema,
  mailSearchQuerySchema,
  mailThreadsQuerySchema,
} from '../mail.ts';
import {
  preferencesPatchSchema,
  setPasswordSchema,
  deleteAccountSchema,
} from '../user.ts';
import { createWorkspaceSchema, updateWorkspaceSchema } from '../workspace.ts';
import { createCalendarEventSchema } from '../calendar.ts';
import { agentChatSchema } from '../agent.ts';
import { billingTopUpSchema } from '../billing.ts';
import { notificationReadSchema } from '../notifications.ts';
import { formatZodError } from '../http.ts';

const futureDate = new Date(Date.now() + 60_000).toISOString();

describe('validation common', () => {
  it('validates email', () => {
    assert.equal(emailSchema.safeParse('user@example.com').success, true);
    assert.equal(emailSchema.safeParse('not-an-email').success, false);
  });

  it('validates recipients with display names', () => {
    assert.equal(
      recipientsSchema.safeParse('Alice <alice@example.com>, bob@example.com').success,
      true
    );
    assert.equal(recipientsSchema.safeParse('invalid').success, false);
  });

  it('validates pagination query', () => {
    const parsed = paginationQuerySchema.parse({ limit: '25', offset: '0' });
    assert.equal(parsed.limit, 25);
    assert.equal(parsed.offset, 0);
  });

  it('requires future schedule time', () => {
    assert.equal(futureIsoDateTimeSchema.safeParse(futureDate).success, true);
    assert.equal(
      futureIsoDateTimeSchema.safeParse('2020-01-01T00:00:00.000Z').success,
      false
    );
  });

  it('validates google message id', () => {
    assert.equal(googleMessageIdSchema.safeParse('19ecf1a4480d9606').success, true);
    assert.equal(googleMessageIdSchema.safeParse('bad id!').success, false);
  });
});

describe('validation user', () => {
  it('validates preferences patch', () => {
    assert.equal(
      preferencesPatchSchema.safeParse({ onboardingCompleted: true }).success,
      true
    );
    assert.equal(preferencesPatchSchema.safeParse({}).success, false);
  });

  it('validates password length', () => {
    assert.equal(setPasswordSchema.safeParse({ newPassword: 'short' }).success, false);
    assert.equal(
      setPasswordSchema.safeParse({ newPassword: 'longenough' }).success,
      true
    );
  });

  it('validates delete account email', () => {
    assert.equal(
      deleteAccountSchema.safeParse({ confirmEmail: 'user@example.com' }).success,
      true
    );
  });
});

describe('validation mail', () => {
  it('validates send fields', () => {
    const result = mailSendFieldsSchema.safeParse({
      to: 'user@example.com',
      subject: 'Hello',
      text: 'Body',
      isDraft: false,
    });
    assert.equal(result.success, true);
  });

  it('validates reply fields', () => {
    const result = mailReplyFieldsSchema.safeParse({
      replyText: 'Thanks',
      threadId: '19ecf1a4480d9606',
      to: 'sender@example.com',
      subject: 'Re: Hello',
    });
    assert.equal(result.success, true);
  });

  it('validates search query', () => {
    assert.equal(mailSearchQuerySchema.safeParse({ q: 'invoice' }).success, true);
    assert.equal(mailSearchQuerySchema.safeParse({ q: '' }).success, false);
  });

  it('validates threads query', () => {
    const parsed = mailThreadsQuerySchema.parse({ offset: '5', category: 'INBOX' });
    assert.equal(parsed.offset, 5);
    assert.equal(parsed.category, 'INBOX');
  });
});

describe('validation workspace', () => {
  it('validates create workspace', () => {
    assert.equal(
      createWorkspaceSchema.safeParse({
        primaryPluginId: 'email',
        sidebarPluginId: 'calendar',
      }).success,
      true
    );
    assert.equal(
      createWorkspaceSchema.safeParse({ primaryPluginId: 'invalid' }).success,
      false
    );
  });

  it('requires at least one update field', () => {
    assert.equal(updateWorkspaceSchema.safeParse({}).success, false);
    assert.equal(updateWorkspaceSchema.safeParse({ name: 'Work' }).success, true);
  });
});

describe('validation calendar', () => {
  it('validates create event with ordered times', () => {
    const start = futureDate;
    const end = new Date(Date.now() + 120_000).toISOString();
    const result = createCalendarEventSchema.safeParse({
      summary: 'Standup',
      start: { dateTime: start },
      end: { dateTime: end },
    });
    assert.equal(result.success, true);
  });

  it('rejects end before start', () => {
    const result = createCalendarEventSchema.safeParse({
      summary: 'Bad',
      start: { dateTime: futureDate },
      end: { dateTime: '2020-01-01T00:00:00.000Z' },
    });
    assert.equal(result.success, false);
  });
});

describe('validation agent', () => {
  it('validates chat message', () => {
    assert.equal(agentChatSchema.safeParse({ message: 'Hello' }).success, true);
    assert.equal(agentChatSchema.safeParse({ message: '' }).success, false);
  });
});

describe('validation billing', () => {
  it('validates pack id uuid', () => {
    assert.equal(
      billingTopUpSchema.safeParse({
        packId: '550e8400-e29b-41d4-a716-446655440000',
      }).success,
      true
    );
    assert.equal(billingTopUpSchema.safeParse({ packId: 'not-uuid' }).success, false);
  });
});

describe('validation notifications', () => {
  it('accepts id or markAll', () => {
    assert.equal(
      notificationReadSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
      }).success,
      true
    );
    assert.equal(notificationReadSchema.safeParse({ markAll: true }).success, true);
    assert.equal(notificationReadSchema.safeParse({}).success, false);
  });
});

describe('formatZodError', () => {
  it('formats first issue', () => {
    const parsed = emailSchema.safeParse('bad');
    if (parsed.success) throw new Error('expected failure');
    const msg = formatZodError(parsed.error);
    assert.match(msg, /email/i);
  });
});
