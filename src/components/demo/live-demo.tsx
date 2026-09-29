'use client';

import { useState } from 'react';
import { ArrowClockwise, PaperPlaneTilt } from '@phosphor-icons/react/dist/ssr';
import { EventDetail } from '@/components/inspector/event-detail';
import { EventList } from '@/components/inspector/event-list';
import { CopyButton } from '@/components/ui/interactive';
import { Spinner } from '@/components/ui/motion';
import { apiPost, isApiError } from '@/lib/client/api';
import { useEventStream } from '@/lib/client/use-event-stream';
import { useOrigin } from '@/lib/client/site';
import type { Delivery, EventRecord } from '@/lib/types';

export function LiveDemo(): React.JSX.Element {
  const origin = useOrigin();
  const { events, connected } = useEventStream('/api/demo/stream', 120);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [replaying, setReplaying] = useState(false);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const selected = events.find((event) => event.id === selectedId) ?? null;
  const demoUrl = `${origin}/in/demo`;
  const curl = `curl -X POST ${demoUrl} -H "content-type: application/json" -d '{"hello":"world"}'`;

  async function sendSample(): Promise<void> {
    setSending(true);
    setNotice(null);
    try {
      const result = await apiPost<{ event: EventRecord }>('/demo/sample');
      setSelectedId(result.event.id);
    } catch (error) {
      setNotice(isApiError(error) ? error.message : 'Could not send a sample request');
    } finally {
      setSending(false);
    }
  }

  async function replay(): Promise<void> {
    if (!selected) return;
    setReplaying(true);
    setNotice(null);
    try {
      const result = await apiPost<{ delivery: Delivery; target: string }>('/demo/replay', {
        eventId: selected.id,
      });
      setDelivery(result.delivery);
    } catch (error) {
      setNotice(isApiError(error) ? error.message : 'Replay failed');
    } finally {
      setReplaying(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="panel flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2 rounded-lg border border-line bg-bg-off py-2 pr-1.5 pl-3">
          <code className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-ink-2">
            {demoUrl}
          </code>
          <CopyButton label="copy" value={curl} />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button className="btn btn-ghost" disabled={sending} onClick={sendSample} type="button">
            {sending ? <Spinner /> : <PaperPlaneTilt size={15} />}
            Send a test request
          </button>
        </div>
      </div>

      {notice && (
        <p className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2 text-[12.5px] text-[var(--danger)]">
          {notice}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(280px,0.85fr)_1.15fr]">
        <div className="panel h-[560px] overflow-hidden">
          <EventList
            connected={connected}
            emptyLabel="Send a request to /in/demo to see it here…"
            events={events}
            onSelect={(id) => {
              setSelectedId(id);
              setDelivery(null);
            }}
            selectedId={selectedId}
          />
        </div>

        <div className="panel h-[560px] overflow-hidden">
          {selected ? (
            <EventDetail
              actions={
                <button
                  className="btn btn-ghost !py-1.5 text-[12px]"
                  disabled={replaying}
                  onClick={replay}
                  type="button"
                >
                  {replaying ? <Spinner /> : <ArrowClockwise size={14} />}
                  Replay to /api/echo
                </button>
              }
              deliveries={delivery && delivery.eventId === selected.id ? [delivery] : []}
              event={selected}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <p className="font-mono text-[11px] tracking-wider text-ink-3 uppercase">
                no request selected
              </p>
              <p className="max-w-xs text-[13px] leading-relaxed text-ink-2">
                Pick a request on the left to see its headers, body, and query — or send one and
                watch it appear.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
