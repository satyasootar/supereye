/**
 * Platform-wide configuration stored in the database.
 */
import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { users } from './auth';

export const platformSettings = pgTable('platform_settings', {
  id: text('id').primaryKey(),
  demoLoginEnabled: boolean('demo_login_enabled').notNull().default(true),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: text('updated_by').references(() => users.id, { onDelete: 'set null' }),
});
