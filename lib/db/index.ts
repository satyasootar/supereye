/**
 * Drizzle ORM database connection.
 * Uses node-postgres with connection string from environment.
 * All schemas are loaded for relational query support.
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { pool } from './pool';

export const db = drizzle(pool, { schema });

// Re-export schema for convenience
export * from './schema';
