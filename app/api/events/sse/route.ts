/**
 * Server-Sent Events endpoint.
 * Streams real-time updates to connected browser clients.
 * Webhook handlers emit events → this route pushes them to the browser.
 *
 * Client usage:
 *   const eventSource = new EventSource('/api/events/sse');
 *   eventSource.onmessage = (e) => console.log(JSON.parse(e.data));
 */
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { sseEmitter } from '@/lib/sse/emitter';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const userId = session.user.id;
  const encoder = new TextEncoder();

  let heartbeat: ReturnType<typeof setInterval>;
  let unsubscribe: () => void;

  const stream = new ReadableStream({
    start(controller) {
      const cleanup = () => {
        if (heartbeat) clearInterval(heartbeat);
        if (unsubscribe) unsubscribe();
        req.signal.removeEventListener('abort', cleanup);
      };

      if (req.signal.aborted) {
        return cleanup();
      }

      req.signal.addEventListener('abort', cleanup);

      // Send initial connection event
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`
        )
      );

      // Subscribe to events for this user
      unsubscribe = sseEmitter.on(userId, (event) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          // Stream might be closed
          cleanup();
        }
      });

      // Send heartbeat every 30 seconds to keep connection alive
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          cleanup();
        }
      }, 30_000);
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat);
      if (unsubscribe) unsubscribe();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
