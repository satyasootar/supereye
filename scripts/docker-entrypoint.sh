#!/bin/sh
set -e

echo "[entrypoint] Waiting for PostgreSQL..."
until node -e "
  const pg = require('pg');
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  pool.query('SELECT 1')
    .then(() => { pool.end(); process.exit(0); })
    .catch(() => { pool.end(); process.exit(1); });
" 2>/dev/null; do
  sleep 2
done
echo "[entrypoint] PostgreSQL is ready"

echo "[entrypoint] Running database migrations..."
node scripts/migrate.mjs

echo "[entrypoint] Bootstrapping Corsair integrations..."
node scripts/corsair-bootstrap.mjs

echo "[entrypoint] Starting Next.js..."
exec node server.js
