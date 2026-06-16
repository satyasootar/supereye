/** How long cached integration data is considered fresh before background sync. */
export const SYNC_STALE_MS = {
  gmail: 5 * 60_000,
  googlecalendar: 15 * 60_000,
  googledrive: 10 * 60_000,
  github: 10 * 60_000,
} as const;

export type SyncProvider = keyof typeof SYNC_STALE_MS;

/** Client-side Zustand + React Query freshness (no API call if younger). */
export const CLIENT_CACHE_STALE_MS = {
  default: 5 * 60_000,
  integration: 10 * 60_000,
  mail: 3 * 60_000,
  calendar: 5 * 60_000,
} as const;
