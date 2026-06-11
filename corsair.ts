import { config } from 'dotenv';
config({ path: '.env.local' });
import { Pool } from 'pg';
import { createCorsair } from 'corsair';
import { gmail } from '@corsair-dev/gmail';
import { googlecalendar } from '@corsair-dev/googlecalendar';

// 1. Initialize Postgres connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 2. Initialize Corsair SDK with plugins
export const corsair = createCorsair({
    plugins: [gmail(), googlecalendar()],
    database: pool,
    kek: process.env.CORSAIR_KEK || 'test-key-000000000000000000000000',
    multiTenancy: true,
});
