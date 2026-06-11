import { Pool } from 'pg';

const globalForPg = globalThis as typeof globalThis & {
  __supereyePool?: Pool;
};

export const pool =
  globalForPg.__supereyePool ??
  new Pool({
    connectionString: process.env.DATABASE_URL!,
    max: process.env.NODE_ENV === 'development' ? 5 : 10,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPg.__supereyePool = pool;
}
