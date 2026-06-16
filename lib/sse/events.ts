/**
 * Typed SSE Event Registry.
 *
 * All SSE event types must be declared here. This gives compile-time
 * safety when emitting or listening for events across the codebase.
 */

// ─── Event Types ────────────────────────────────────────────────────────
export type SSEEventType =
  // Email
  | 'email:updated'
  | 'email:triage'
  | 'brief:updated'
  // Calendar
  | 'calendar:updated'
  // GitHub
  | 'github:updated'
  // Drive
  | 'drive:updated'
  // Notifications
  | 'notification:new'
  // Cross-app sync
  | 'sync:requested';

// ─── Event Payload ──────────────────────────────────────────────────────
export type SSEEvent = {
  type: SSEEventType;
  data?: Record<string, unknown>;
  timestamp: string;
};

export type SSEInvalidationTarget = {
  queryKeys: string[][];
  cacheNamespaces: string[];
};

// ─── Event-to-QueryKey Mapping ──────────────────────────────────────────
export const SSE_INVALIDATION_MAP: Record<SSEEventType, SSEInvalidationTarget> = {
  'email:updated': {
    queryKeys: [
      ['mail-threads'],
      ['emails', 'threads'],
      ['emails', 'unread-count'],
      ['brief', 'today'],
    ],
    cacheNamespaces: ['emails', 'mail-threads', 'brief'],
  },
  'email:triage': {
    queryKeys: [['emails', 'threads'], ['emails', 'triage'], ['brief', 'today']],
    cacheNamespaces: ['emails', 'brief'],
  },
  'brief:updated': {
    queryKeys: [['brief', 'today']],
    cacheNamespaces: ['brief'],
  },
  'calendar:updated': {
    queryKeys: [['calendar-events'], ['calendar', 'events'], ['brief', 'today']],
    cacheNamespaces: ['calendar', 'brief'],
  },
  'github:updated': {
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
  'drive:updated': {
    queryKeys: [['drive', 'files'], ['drive', 'recent'], ['drive', 'search']],
    cacheNamespaces: ['drive'],
  },
  'notification:new': {
    queryKeys: [['notifications']],
    cacheNamespaces: ['notifications'],
  },
  'sync:requested': {
    queryKeys: [
      ['mail-threads'],
      ['emails', 'threads'],
      ['emails', 'unread-count'],
      ['calendar-events'],
      ['calendar', 'events'],
      ['github'],
      ['drive'],
    ],
    cacheNamespaces: ['emails', 'mail-threads', 'calendar', 'github', 'drive'],
  },
};
