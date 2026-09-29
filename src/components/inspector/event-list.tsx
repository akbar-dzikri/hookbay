'use client';

import { Broadcast } from '@phosphor-icons/react/dist/ssr';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { MethodBadge, StatusDot } from '@/components/ui/primitives';
import { formatBytes, timeAgo, truncate } from '@/lib/format';
import type { EventRecord } from '@/lib/types';

function Ticker({ receivedAt }: { receivedAt: string }): React.JSX.Element {
  const [, force] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => force((value) => value + 1), 15_000);
    return () => clearInterval(timer);
  }, []);
  return (
    <span className="font-mono-num shrink-0 text-[11px] text-ink-3">{timeAgo(receivedAt)}</span>
  );
}

export function EventList({
  events,
  selectedId,
  onSelect,
  connected,
  compact = false,
  emptyLabel = 'Waiting for the first request…',
  header,
}: {
  events: EventRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  connected: boolean;
  compact?: boolean;
  emptyLabel?: string;
  header?: React.ReactNode;
}): React.JSX.Element {
  const reduce = useReducedMotion();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <div className="flex items-center gap-2">
          <StatusDot live={connected} />
          <span className="font-mono text-[11px] tracking-wider text-ink-2 uppercase">
            {connected ? 'streaming live' : 'connecting'}
          </span>
        </div>
        <span className="font-mono-num text-[11px] text-ink-3">{events.length}</span>
      </div>
      {header}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {events.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <Broadcast className="text-ink-3" size={22} />
            <p className="font-mono text-[11px] text-ink-3">{emptyLabel}</p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {events.map((event) => (
            <motion.button
              animate={{ opacity: 1, y: 0 }}
              className={`flex w-full items-center gap-3 border-b border-line px-3 text-left transition-colors hover:bg-mono-bg ${
                compact ? 'py-2' : 'py-2.5'
              } ${selectedId === event.id ? 'bg-mono-bg shadow-[inset_2px_0_0_0_var(--accent)]' : ''}`}
              exit={{ opacity: 0 }}
              initial={reduce ? false : { opacity: 0, y: -8 }}
              key={event.id}
              onClick={() => onSelect(event.id)}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              type="button"
            >
              <MethodBadge method={event.method} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-mono text-[12px] text-ink">
                  {truncate(event.path, compact ? 24 : 44)}
                </span>
                {!compact && (
                  <span className="mt-0.5 block truncate font-mono text-[10.5px] text-ink-3">
                    {Object.keys(event.query).length > 0
                      ? `?${new URLSearchParams(event.query).toString()}`
                      : formatBytes(event.bodySize)}
                  </span>
                )}
              </span>
              <Ticker receivedAt={event.receivedAt} />
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
