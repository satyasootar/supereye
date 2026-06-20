/**
 * Billing, subscriptions, token wallets, and admin audit tables.
 */
import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  uuid,
  integer,
  bigint,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { users } from './auth';

export const userRoleEnum = ['super_admin', 'admin', 'user', 'enterprise_user'] as const;
export type UserRole = (typeof userRoleEnum)[number];

export const userStatusEnum = ['active', 'suspended'] as const;
export type UserStatus = (typeof userStatusEnum)[number];

export const subscriptionStatusEnum = [
  'active',
  'trialing',
  'past_due',
  'canceled',
  'expired',
] as const;

export const invoiceStatusEnum = [
  'draft',
  'open',
  'paid',
  'void',
  'uncollectible',
] as const;

export const ledgerActionEnum = [
  'plan_renewal',
  'ai_usage',
  'admin_allocation',
  'admin_removal',
  'token_purchase',
  'bonus_credits',
  'period_reset',
  'subscription_start',
] as const;

// ─── Subscription Plans ─────────────────────────────────────────────────
export const plans = pgTable(
  'plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    priceCents: integer('price_cents').notNull().default(0),
    billingInterval: text('billing_interval').notNull().default('month'),
    monthlyTokens: bigint('monthly_tokens', { mode: 'number' }).notNull().default(0),
    isEnterprise: boolean('is_enterprise').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    featureFlags: jsonb('feature_flags').$type<Record<string, boolean>>().default({}),
    pluginLimit: integer('plugin_limit'),
    teamMemberLimit: integer('team_member_limit'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('uq_plans_slug').on(t.slug)]
);

// ─── User Subscriptions ─────────────────────────────────────────────────
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    planId: uuid('plan_id')
      .notNull()
      .references(() => plans.id),
    status: text('status').$type<(typeof subscriptionStatusEnum)[number]>().notNull().default('active'),
    currentPeriodStart: timestamp('current_period_start', { withTimezone: true }).notNull(),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_subscriptions_user_id').on(t.userId),
    index('idx_subscriptions_plan_id').on(t.planId),
    index('idx_subscriptions_status').on(t.status),
  ]
);

// ─── Token Wallets ──────────────────────────────────────────────────────
export const tokenWallets = pgTable('token_wallets', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  balance: bigint('balance', { mode: 'number' }).notNull().default(0),
  monthlyAllocation: bigint('monthly_allocation', { mode: 'number' }).notNull().default(0),
  bonusAllocation: bigint('bonus_allocation', { mode: 'number' }).notNull().default(0),
  usedThisPeriod: bigint('used_this_period', { mode: 'number' }).notNull().default(0),
  periodStart: timestamp('period_start', { withTimezone: true }),
  periodEnd: timestamp('period_end', { withTimezone: true }),
  unlimited: boolean('unlimited').notNull().default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Token Ledger (audit trail) ─────────────────────────────────────────
export const tokenLedger = pgTable(
  'token_ledger',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    action: text('action').$type<(typeof ledgerActionEnum)[number]>().notNull(),
    tokensAdded: bigint('tokens_added', { mode: 'number' }).notNull().default(0),
    tokensRemoved: bigint('tokens_removed', { mode: 'number' }).notNull().default(0),
    previousBalance: bigint('previous_balance', { mode: 'number' }).notNull(),
    newBalance: bigint('new_balance', { mode: 'number' }).notNull(),
    reason: text('reason'),
    referenceType: text('reference_type'),
    referenceId: text('reference_id'),
    adminUserId: text('admin_user_id').references(() => users.id, { onDelete: 'set null' }),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_token_ledger_user_id').on(t.userId),
    index('idx_token_ledger_created_at').on(t.createdAt),
    index('idx_token_ledger_action').on(t.action),
  ]
);

// ─── Configurable AI action token costs ─────────────────────────────────
export const tokenActionCosts = pgTable(
  'token_action_costs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actionKey: text('action_key').notNull(),
    displayName: text('display_name').notNull(),
    tokenCost: integer('token_cost').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('uq_token_action_costs_key').on(t.actionKey)]
);

// ─── Token top-up packs ─────────────────────────────────────────────────
export const tokenTopUpPacks = pgTable('token_top_up_packs', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  tokenAmount: bigint('token_amount', { mode: 'number' }).notNull(),
  priceCents: integer('price_cents').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Invoices ───────────────────────────────────────────────────────────
export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    invoiceNumber: text('invoice_number').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    subscriptionId: uuid('subscription_id').references(() => subscriptions.id, {
      onDelete: 'set null',
    }),
    planId: uuid('plan_id').references(() => plans.id, { onDelete: 'set null' }),
    amountCents: integer('amount_cents').notNull(),
    status: text('status').$type<(typeof invoiceStatusEnum)[number]>().notNull().default('open'),
    paymentMethod: text('payment_method'),
    issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
    dueAt: timestamp('due_at', { withTimezone: true }),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    periodStart: timestamp('period_start', { withTimezone: true }),
    periodEnd: timestamp('period_end', { withTimezone: true }),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('uq_invoices_number').on(t.invoiceNumber),
    index('idx_invoices_user_id').on(t.userId),
    index('idx_invoices_status').on(t.status),
  ]
);

// ─── Payments ───────────────────────────────────────────────────────────
export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    amountCents: integer('amount_cents').notNull(),
    status: text('status').notNull().default('completed'),
    paymentMethod: text('payment_method'),
    externalId: text('external_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('idx_payments_user_id').on(t.userId)]
);

// ─── Organizations (Enterprise) ─────────────────────────────────────────
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  ownerUserId: text('owner_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const enterpriseAccounts = pgTable(
  'enterprise_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    customPlanId: uuid('custom_plan_id').references(() => plans.id, { onDelete: 'set null' }),
    customMonthlyTokens: bigint('custom_monthly_tokens', { mode: 'number' }),
    customFeatureFlags: jsonb('custom_feature_flags').$type<Record<string, boolean>>(),
    customPluginLimit: integer('custom_plugin_limit'),
    customTeamMemberLimit: integer('custom_team_member_limit'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('uq_enterprise_accounts_user').on(t.userId),
    index('idx_enterprise_accounts_org').on(t.organizationId),
  ]
);

// ─── Admin audit logs ───────────────────────────────────────────────────
export const adminAuditLogs = pgTable(
  'admin_audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    adminUserId: text('admin_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    action: text('action').notNull(),
    targetType: text('target_type'),
    targetId: text('target_id'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_admin_audit_admin').on(t.adminUserId),
    index('idx_admin_audit_created').on(t.createdAt),
  ]
);
