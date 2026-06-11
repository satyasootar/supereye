/**
 * Drizzle ORM database connection.
 * Uses node-postgres with connection string from environment.
 * All schemas are loaded for relational query support.
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

export const db = drizzle(pool, { schema });

// Re-export schema for convenience
export * from './schema';
