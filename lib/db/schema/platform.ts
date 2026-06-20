/**
 * Platform-wide configuration stored in the database.
 */
import { pgTable, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { plans } from './billing';

export const platformSettings = pgTable('platform_settings', {
  id: text('id').primaryKey(),
  demoLoginEnabled: boolean('demo_login_enabled').notNull().default(true),
  defaultSignupPlanId: uuid('default_signup_plan_id').references(() => plans.id, {
    onDelete: 'set null',
  }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: text('updated_by').references(() => users.id, { onDelete: 'set null' }),
});
