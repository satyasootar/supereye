/**
 * Corsair SDK initialization.
 * Configures Gmail and Google Calendar plugins with PostgreSQL storage.
 * Multi-tenancy is enabled — each user gets isolated credentials.
 *
 * IMPORTANT: The root corsair.ts re-exports this file for CLI compatibility.
 * The Corsair CLI (npx corsair setup/auth) looks for corsair.ts in the project root.
 */
import { Pool } from 'pg';
import { createCorsair } from 'corsair';
import { gmail } from '@corsair-dev/gmail';
import { googlecalendar } from '@corsair-dev/googlecalendar';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

export const corsair = createCorsair({
  plugins: [gmail(), googlecalendar()],
  database: pool,
  kek: process.env.CORSAIR_KEK || 'test-key-000000000000000000000000',
  multiTenancy: true,
});
