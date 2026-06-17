/**
 * Run Drizzle migrations (production-safe, no drizzle-kit CLI required).
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.join(__dirname, '..', 'drizzle');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('[migrate] DATABASE_URL is not set');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });

try {
  const db = drizzle(pool);
  console.log('[migrate] Applying migrations from', migrationsFolder);
  await migrate(db, { migrationsFolder });
  console.log('[migrate] Done');
} catch (error) {
  console.error('[migrate] Failed:', error);
  process.exit(1);
} finally {
  await pool.end();
}
