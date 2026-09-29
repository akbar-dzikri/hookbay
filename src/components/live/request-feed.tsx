'use client';

import { Broadcast } from '@phosphor-icons/react/dist/ssr';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { MethodBadge, SkeletonRows, StatusDot } from '@/components/ui/primitives';
import { formatBytes, timeAgo, truncate } from '@/lib/format';
import { useEventStream } from '@/lib/client/use-event-stream';
import type { EventRecord } from '@/lib/types';

function Ticker({ receivedAt }: { receivedAt: string }): React.JSX.Element {
  const [, force] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => force((value) => value + 1), 15_000);
    return () => clearInterval(timer);
  }, []);
  return <span className="font-mono-num text-[11px] text-ink-3">{timeAgo(receivedAt)}</span>;
}

export function RequestFeed({
  streamUrl,
  variant = 'full',
  selectedId,
  onSelect,
  emptyLabel = 'Waiting for the first request…',
  showHeader = true,
}: {
  streamUrl: string | null;
  variant?: 'compact' | 'full';
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  emptyLabel?: string;
  showHeader?: boolean;
}): React.JSX.Element {
  const { events, connected } = useEventStream(streamUrl);
  const reduce = useReducedMotion();
  const compact = variant === 'compact';

  return (
    <div className="flex h-full min-h-0 flex-col">
      {showHeader && (
        <div className="flex items-center justify-between border-b border-line px-3 py-2">
          <div className="flex items-center gap-2">
            <StatusDot live={connected} />
            <span className="font-mono text-[11px] tracking-wider text-ink-2 uppercase">
              {connected ? 'streaming live' : streamUrl ? 'connecting' : 'stream paused'}
            </span>
          </div>
          <span className="font-mono-num text-[11px] text-ink-3">
            {events.length} {events.length === 1 ? 'request' : 'requests'}
          </span>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {events.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <Broadcast className="text-ink-3" size={compact ? 20 : 26} />
            <p className="font-mono text-[11px] text-ink-3">{emptyLabel}</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {events.map((event: EventRecord) => (
            <motion.button
              animate={{ opacity: 1, y: 0 }}
              className={`flex w-full items-center gap-3 border-b border-line px-3 text-left transition-colors hover:bg-mono-bg ${
                compact ? 'py-2' : 'py-2.5'
              } ${selectedId === event.id ? 'bg-mono-bg' : ''}`}
              exit={{ opacity: 0 }}
              initial={reduce ? false : { opacity: 0, y: -8 }}
              key={event.id}
              onClick={() => onSelect?.(event.id)}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              type="button"
            >
              <MethodBadge method={event.method} />
              <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-ink">
                {truncate(event.path, compact ? 26 : 60)}
              </span>
              {!compact && (
                <span className="font-mono-num hidden shrink-0 text-[11px] text-ink-3 sm:inline">
                  {formatBytes(event.bodySize)}
                </span>
              )}
              <Ticker receivedAt={event.receivedAt} />
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function RequestFeedSkeleton(): React.JSX.Element {
  return <SkeletonRows rows={6} />;
}
