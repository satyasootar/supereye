/**
 * Application-specific tables for Supereye.
 * These tables cache Gmail/Calendar data locally and track sync state.
 * The email-event link table powers the killer feature: one-click calendar invite from email.
 */
import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  uuid,
  integer,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { users } from './auth';
import type { UserKeyOverrides } from '@/lib/keyboard/types';

// ─── Cached Gmail Messages ──────────────────────────────────────────────
export const emails = pgTable(
  'emails',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    googleMessageId: text('google_message_id').notNull(),
    threadId: text('thread_id'),
    fromAddress: text('from_address'),
    fromName: text('from_name'),
    toAddresses: jsonb('to_addresses').$type<
      { email: string; name?: string }[]
    >(),
    ccAddresses: jsonb('cc_addresses').$type<
      { email: string; name?: string }[]
    >(),
    subject: text('subject'),
    snippet: text('snippet'),
    body: text('body'),
    labelIds: jsonb('label_ids').$type<string[]>(),
    isRead: boolean('is_read').notNull().default(false),
    isStarred: boolean('is_starred').notNull().default(false),
    isArchived: boolean('is_archived').notNull().default(false),
    internalDate: timestamp('internal_date', { withTimezone: true }),
    historyId: text('history_id'),
    priorityTier: text('priority_tier').$type<'urgent' | 'can_wait'>(),
    priorityScore: integer('priority_score'),
    priorityReason: text('priority_reason'),
    priorityClassifiedAt: timestamp('priority_classified_at', {
      withTimezone: true,
    }),
    insightCategory: text('insight_category').$type<
      | 'action_required'
      | 'meeting'
      | 'otp'
      | 'bank'
      | 'delivery'
      | 'invoice'
      | 'social'
      | 'newsletter'
      | 'fyi'
    >(),
    insightSummary: text('insight_summary'),
    extractedLinks: jsonb('extracted_links').$type<
      { type: string; url: string; label?: string }[]
    >(),
    extractedOtps: jsonb('extracted_otps').$type<
      { code: string; label?: string }[]
    >(),
    insightClassifiedAt: timestamp('insight_classified_at', {
      withTimezone: true,
    }),
    syncedAt: timestamp('synced_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_emails_user_id').on(table.userId),
    index('idx_emails_thread_id').on(table.threadId),
    index('idx_emails_internal_date').on(table.internalDate),
    unique('uq_emails_user_google_msg').on(
      table.userId,
      table.googleMessageId
    ),
  ]
);

// ─── Cached Calendar Events ─────────────────────────────────────────────
export const calendarEvents = pgTable(
  'calendar_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    googleEventId: text('google_event_id').notNull(),
    calendarId: text('calendar_id').notNull().default('primary'),
    title: text('title'),
    description: text('description'),
    location: text('location'),
    startTime: timestamp('start_time', { withTimezone: true }),
    endTime: timestamp('end_time', { withTimezone: true }),
    isAllDay: boolean('is_all_day').notNull().default(false),
    status: text('status').notNull().default('confirmed'),
    attendees: jsonb('attendees').$type<
      { email: string; displayName?: string; responseStatus?: string }[]
    >(),
    organizer: jsonb('organizer').$type<{
      email: string;
      displayName?: string;
      self?: boolean;
    }>(),
    htmlLink: text('html_link'),
    colorId: text('color_id'),
    sourceEmailId: uuid('source_email_id').references(() => emails.id, {
      onDelete: 'set null',
    }),
    syncedAt: timestamp('synced_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_calendar_events_user_id').on(table.userId),
    index('idx_calendar_events_start_time').on(table.startTime),
    index('idx_calendar_events_source_email').on(table.sourceEmailId),
    unique('uq_calendar_events_user_google').on(
      table.userId,
      table.googleEventId
    ),
  ]
);

// ─── Email ↔ Calendar Event Links ───────────────────────────────────────
// Powers the killer feature: see which email spawned a meeting and vice versa
export const emailEventLinks = pgTable(
  'email_event_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    emailId: uuid('email_id')
      .notNull()
      .references(() => emails.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id')
      .notNull()
      .references(() => calendarEvents.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('uq_email_event_link').on(table.emailId, table.eventId),
  ]
);

// ─── Notifications ───────────────────────────────────────────────────────
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // 'email', 'calendar', 'system'
    title: text('title').notNull(),
    body: text('body'),
    link: text('link'),
    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_notifications_user_id').on(table.userId),
    index('idx_notifications_created_at').on(table.createdAt),
  ]
);

// ─── Sync State ─────────────────────────────────────────────────────────
// Tracks incremental sync tokens per user per provider
export const syncState = pgTable(
  'sync_state',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(), // 'gmail' | 'googlecalendar'
    lastSyncToken: text('last_sync_token'),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  },
  (table) => [
    unique('uq_sync_state_user_provider').on(table.userId, table.provider),
  ]
);

// ─── Scheduled Emails ───────────────────────────────────────────────────
export const scheduledEmails = pgTable(
  'scheduled_emails',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rawPayload: text('raw_payload').notNull(),
    threadId: text('thread_id'),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    status: text('status').notNull().default('pending'), // 'pending', 'sent', 'failed'
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_scheduled_emails_status').on(table.status),
    index('idx_scheduled_emails_time').on(table.scheduledAt),
  ]
);

// ─── Agent Chat Threads ─────────────────────────────────────────────────
export const agentThreads = pgTable(
  'agent_threads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull().default('New chat'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_agent_threads_user_id').on(table.userId),
    index('idx_agent_threads_last_message_at').on(table.lastMessageAt),
  ]
);

export const agentMessages = pgTable(
  'agent_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    threadId: uuid('thread_id')
      .notNull()
      .references(() => agentThreads.id, { onDelete: 'cascade' }),
    role: text('role').notNull(), // user | assistant | system
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_agent_messages_thread_id').on(table.threadId),
    index('idx_agent_messages_created_at').on(table.createdAt),
  ]
);

// ─── User Keybindings ───────────────────────────────────────────────────
export const userKeybindings = pgTable('user_keybindings', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  overrides: jsonb('overrides').$type<UserKeyOverrides>().notNull().default({}),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

import type { BotSettings } from '@/lib/plugins/types';

// ─── User Preferences ───────────────────────────────────────────────────
export const userPreferences = pgTable('user_preferences', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
  activeWorkspaceId: uuid('active_workspace_id'),
  botSettings: jsonb('bot_settings').$type<BotSettings>().notNull().default({
    showTips: true,
    autoCloseTips: false,
    autoCloseDelay: 5000,
  }),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Workspaces (max 2 plugins each) ────────────────────────────────────
export const workspaces = pgTable(
  'workspaces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull().default('Workspace'),
    primaryPluginId: text('primary_plugin_id').notNull(),
    sidebarPluginId: text('sidebar_plugin_id'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('idx_workspaces_user_id').on(table.userId)]
);

// ─── AI Usage Events ────────────────────────────────────────────────────
export const aiUsageEvents = pgTable(
  'ai_usage_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    feature: text('feature').notNull(),
    model: text('model'),
    inputTokens: integer('input_tokens').notNull().default(0),
    outputTokens: integer('output_tokens').notNull().default(0),
    totalTokens: integer('total_tokens').notNull().default(0),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_ai_usage_user_id').on(table.userId),
    index('idx_ai_usage_feature').on(table.userId, table.feature),
    index('idx_ai_usage_created_at').on(table.createdAt),
  ]
);

// ─── AI Daily Brief cache ───────────────────────────────────────────────
export const dailyBriefs = pgTable(
  'daily_briefs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    briefDate: text('brief_date').notNull(), // YYYY-MM-DD in user TZ
    narrative: text('narrative'),
    snapshot: jsonb('snapshot').$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('uq_daily_briefs_user_date').on(table.userId, table.briefDate),
    index('idx_daily_briefs_user_id').on(table.userId),
  ]
);
