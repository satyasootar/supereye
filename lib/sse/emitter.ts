/**
 * SSE (Server-Sent Events) event emitter.
 * Provides a simple pub/sub mechanism for broadcasting real-time updates
 * from webhook handlers to connected browser clients.
 *
 * Usage:
 *   - Webhook handler calls: sseEmitter.emit(userId, { type: 'email:new', ... })
 *   - SSE route subscribes: sseEmitter.on(userId, callback)
 */
import type { SSEEvent, SSEEventType } from './events';

type Listener = (event: SSEEvent) => void;

class SSEEmitter {
  private listeners = new Map<string, Set<Listener>>();

  /**
   * Subscribe to events for a specific user.
   * Returns an unsubscribe function.
   */
  on(userId: string, listener: Listener): () => void {
    if (!this.listeners.has(userId)) {
      this.listeners.set(userId, new Set());
    }
    this.listeners.get(userId)!.add(listener);

    // Return unsubscribe function
    return () => {
      const userListeners = this.listeners.get(userId);
      if (userListeners) {
        userListeners.delete(listener);
        if (userListeners.size === 0) {
          this.listeners.delete(userId);
        }
      }
    };
  }

  /**
   * Broadcast a typed event to all listeners for a specific user.
   * The `type` parameter is now compile-time checked against SSEEventType.
   */
  emit(userId: string, event: { type: SSEEventType; data?: Record<string, unknown> }) {
    const userListeners = this.listeners.get(userId);
    if (userListeners) {
      const fullEvent: SSEEvent = {
        ...event,
        timestamp: new Date().toISOString(),
      };
      for (const listener of userListeners) {
        try {
          listener(fullEvent);
        } catch {
          // Don't let one bad listener break others
        }
      }
    }
  }

  /**
   * Get the number of active listeners for a user (useful for debugging).
   */
  listenerCount(userId: string): number {
    return this.listeners.get(userId)?.size ?? 0;
  }
}

const globalForSSE = globalThis as typeof globalThis & {
  __supereyeSSEEmitter?: SSEEmitter;
};

// Singleton instance — shared across all API routes and persisted on globalThis in dev mode
export const sseEmitter =
  globalForSSE.__supereyeSSEEmitter ?? new SSEEmitter();

if (process.env.NODE_ENV !== 'production') {
  globalForSSE.__supereyeSSEEmitter = sseEmitter;
}

export type { SSEEvent };
