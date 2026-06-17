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
import { googledrive } from '@corsair-dev/googledrive';
import { pool } from '@/lib/db/pool';

function getCorsairKek(): string {
  const kek = process.env.CORSAIR_KEK;
  if (!kek) {
    // Next.js `next build` sets NEXT_PHASE=phase-production-build — no real secrets yet.
    const isNextBuild = process.env.NEXT_PHASE === 'phase-production-build';
    if (process.env.NODE_ENV === 'production' && !isNextBuild) {
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
    plugins: [
      gmail(),
      googlecalendar(),
      github({ authType: 'oauth_2' }),
      googledrive(),
    ],
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

