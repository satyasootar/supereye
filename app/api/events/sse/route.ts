/**
 * Server-Sent Events endpoint.
 * Streams real-time updates to connected browser clients.
 * Webhook handlers emit events → this route pushes them to the browser.
 *
 * Client usage:
 *   const eventSource = new EventSource('/api/events/sse');
 *   eventSource.onmessage = (e) => console.log(JSON.parse(e.data));
 */
import { auth } from '@/lib/auth';
import { sseEmitter } from '@/lib/sse/emitter';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`
        )
      );

      // Subscribe to events for this user
      const unsubscribe = sseEmitter.on(userId, (event) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          // Stream might be closed
          unsubscribe();
        }
      });

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
          unsubscribe();
        }
      }, 30_000);

      // Cleanup when client disconnects — not available in all runtimes,
      // but the heartbeat catch will handle cleanup as a fallback
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
