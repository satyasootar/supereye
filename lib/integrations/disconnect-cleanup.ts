import type { SyncProvider } from '@/lib/cache/sync-policy';
import { corsairPluginSchema } from '@/lib/validation/common';
import type { z } from 'zod';

export type CorsairPlugin = z.infer<typeof corsairPluginSchema>;

export type PluginDisconnectCleanup = {
  integrationCachePrefix: string | null;
  syncProvider: SyncProvider | null;
  queryKeys: string[][];
  cacheNamespaces: string[];
};

export const PLUGIN_DISCONNECT_CLEANUP: Record<CorsairPlugin, PluginDisconnectCleanup> = {
  github: {
    integrationCachePrefix: 'github:',
    syncProvider: 'github',
    queryKeys: [
      ['github', 'repos'],
      ['github', 'overview'],
      ['github', 'inbox'],
      ['github', 'repo'],
      ['github', 'activity'],
      ['github', 'pulls'],
      ['github', 'issues'],
    ],
    cacheNamespaces: ['github'],
  },
  googledrive: {
    integrationCachePrefix: 'drive:',
    syncProvider: 'googledrive',
    queryKeys: [['drive', 'files'], ['drive', 'recent'], ['drive', 'search']],
    cacheNamespaces: ['drive'],
  },
  gmail: {
    integrationCachePrefix: null,
    syncProvider: 'gmail',
    queryKeys: [
      ['mail-threads'],
      ['emails', 'threads'],
      ['emails', 'unread-count'],
      ['emails', 'triage'],
      ['brief', 'today'],
    ],
    cacheNamespaces: ['emails', 'mail-threads', 'brief'],
  },
  googlecalendar: {
    integrationCachePrefix: null,
    syncProvider: 'googlecalendar',
    queryKeys: [
      ['calendar-events'],
      ['calendar', 'events'],
      ['calendar', 'contacts'],
      ['brief', 'today'],
    ],
    cacheNamespaces: ['calendar', 'brief'],
  },
};

export function getPluginDisconnectCleanup(
  corsairPlugin: CorsairPlugin
): PluginDisconnectCleanup {
  return PLUGIN_DISCONNECT_CLEANUP[corsairPlugin];
}
