/**
 * Typed SSE Event Registry.
 * 
 * All SSE event types must be declared here. This gives compile-time
 * safety when emitting or listening for events across the codebase.
 * 
 * When adding a new integration (e.g., Slack, Linear, AI), add its
 * event types here and TypeScript will flag every listener that needs
 * updating.
 */

// ─── Event Types ────────────────────────────────────────────────────────
export type SSEEventType =
  // Email
  | 'email:updated'
  | 'email:triage'
  | 'brief:updated'
  // Calendar
  | 'calendar:updated'
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

// ─── Event-to-QueryKey Mapping ──────────────────────────────────────────
// Maps SSE event types to the React Query keys that should be invalidated.
// This centralizes the "what to refresh when X happens" logic so the
// SSE hook doesn't need a growing if/else chain.
export const SSE_INVALIDATION_MAP: Record<SSEEventType, string[][]> = {
  'email:updated': [['mail-threads'], ['emails', 'threads'], ['emails', 'unread-count'], ['brief', 'today']],
  'email:triage': [['emails', 'threads'], ['emails', 'triage'], ['brief', 'today']],
  'brief:updated': [['brief', 'today']],
  'calendar:updated': [['calendar-events'], ['calendar', 'events'], ['brief', 'today']],
  'notification:new': [['notifications']],
  'sync:requested': [['mail-threads'], ['emails', 'threads'], ['emails', 'unread-count'], ['calendar-events'], ['calendar', 'events']],
};
