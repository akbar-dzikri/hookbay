'use client';

import { useEffect, useState } from 'react';
import type { EventRecord } from '@/lib/types';

export interface EventStreamState {
  events: EventRecord[];
  connected: boolean;
}

export function useEventStream(url: string | null, limit = 200): EventStreamState {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!url) {
      setEvents([]);
      setConnected(false);
      return;
    }

    setEvents([]);
    const source = new EventSource(url);

    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    source.addEventListener('request', (message) => {
      try {
        const event = JSON.parse((message as MessageEvent<string>).data) as EventRecord;
        setEvents((previous) => {
          if (previous.some((item) => item.id === event.id)) return previous;
          return [event, ...previous].slice(0, limit);
        });
      } catch {
        // ignore malformed frames
      }
    });

    return () => {
      source.close();
      setConnected(false);
    };
  }, [url, limit]);

  return { events, connected };
}
