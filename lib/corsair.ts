/**
 * Corsair SDK initialization.
 * Integrations (OAuth tokens) are stored per user via tenantId = session.user.id.
 * Workspaces are UI compositions — each workspace assigns up to 2 connected plugins
 * to primary/sidebar panels without duplicating Corsair credentials.
 */
import { createCorsair } from 'corsair';
import { gmail } from '@corsair-dev/gmail';
import { googlecalendar } from '@corsair-dev/googlecalendar';
import { github } from '@corsair-dev/github';
import { pool } from '@/lib/db/pool';

function getCorsairKek(): string {
  const kek = process.env.CORSAIR_KEK;
  if (!kek) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CORSAIR_KEK must be set in production');
    }
    return 'test-key-000000000000000000000000';
  }
  return kek;
}

const globalForCorsair = globalThis as typeof globalThis & {
  __supereyeCorsair?: ReturnType<typeof createCorsair>;
};

export const corsair =
  globalForCorsair.__supereyeCorsair ??
  createCorsair({
    plugins: [gmail(), googlecalendar(), github()],
    database: pool,
    kek: getCorsairKek(),
    multiTenancy: true,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForCorsair.__supereyeCorsair = corsair;
}

/**
 * Get a typed Corsair tenant for a given user.
 * Use this everywhere instead of `corsair.withTenant(userId) as any`.
 * As we add more plugins (Slack, Linear, etc.), the return type
 * automatically expands to include their APIs.
 */
export function getTenant(userId: string) {
  return corsair.withTenant(userId);
}

