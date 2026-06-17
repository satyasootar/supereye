/**
 * Corsair SDK entry-point for CLI compatibility.
 * The Corsair CLI (npx corsair setup/auth/list/schema) loads this file
 * directly and calls setupCorsair(corsair, ...). It validates the instance
 * via an internal Symbol on the object, which is lost when going through
 * require() CJS interop. So we re-create the instance here directly.
 *
 * DO NOT use require('./lib/corsair') here — it breaks the CLI's internal
 * Symbol check and causes "invalid corsair instance".
 */
import { config } from 'dotenv';
config({ path: '.env' });
config({ path: '.env.local' });

import { createCorsair } from 'corsair';
import { gmail } from '@corsair-dev/gmail';
import { googlecalendar } from '@corsair-dev/googlecalendar';
import { github } from '@corsair-dev/github';
import { googledrive } from '@corsair-dev/googledrive';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function getCorsairKek(): string {
  const kek = process.env.CORSAIR_KEK;
  if (!kek) return 'test-key-000000000000000000000000';
  return kek;
}

export const corsair = createCorsair({
  plugins: [gmail(), googlecalendar(), github(), googledrive()],
  database: pool,
  kek: getCorsairKek(),
  multiTenancy: true,
});
