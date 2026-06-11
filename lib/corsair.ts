/**
 * Corsair SDK initialization.
 * Configures Gmail and Google Calendar plugins with PostgreSQL storage.
 * Multi-tenancy is enabled — each user gets isolated credentials.
 *
 * IMPORTANT: The root corsair.ts re-exports this file for CLI compatibility.
 * The Corsair CLI (npx corsair setup/auth) looks for corsair.ts in the project root.
 */
import { createCorsair } from 'corsair';
import { gmail } from '@corsair-dev/gmail';
import { googlecalendar } from '@corsair-dev/googlecalendar';
import { pool } from '@/lib/db/pool';

const globalForCorsair = globalThis as typeof globalThis & {
  __supereyeCorsair?: ReturnType<typeof createCorsair>;
};

export const corsair =
  globalForCorsair.__supereyeCorsair ??
  createCorsair({
    plugins: [gmail(), googlecalendar()],
    database: pool,
    kek: process.env.CORSAIR_KEK || 'test-key-000000000000000000000000',
    multiTenancy: true,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForCorsair.__supereyeCorsair = corsair;
}
