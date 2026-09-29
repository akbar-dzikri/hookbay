import { bus, channelName } from './bus';
import type { EventRecord } from './types';

const SSE_HEADERS: Record<string, string> = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
};

interface StreamOptions {
  endpointId: string;
  initial: EventRecord[];
  signal: AbortSignal;
}

export function createEventStream({ endpointId, initial, signal }: StreamOptions): Response {
  const encoder = new TextEncoder();
  let cleanup: () => void = () => {};

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const write = (chunk: string): void => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
        }
      };

      const onEvent = (event: EventRecord): void => {
        write(`event: request\ndata: ${JSON.stringify(event)}\n\n`);
      };

      for (const event of initial) onEvent(event);

      const channel = channelName(endpointId);
      bus.on(channel, onEvent);
      const heartbeat = setInterval(() => write(`: keepalive\n\n`), 15_000);

      cleanup = (): void => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        bus.off(channel, onEvent);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      signal.addEventListener('abort', cleanup, { once: true });
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
