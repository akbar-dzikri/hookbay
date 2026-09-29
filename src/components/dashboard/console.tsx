'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowClockwise, Broom, Gear } from '@phosphor-icons/react/dist/ssr';
import { EventDetail } from '@/components/inspector/event-detail';
import { EventList } from '@/components/inspector/event-list';
import { EndpointSettings } from '@/components/dashboard/endpoint-settings';
import { CopyButton } from '@/components/ui/interactive';
import { Spinner } from '@/components/ui/motion';
import { useClearEvents, useEndpoints, useEventDetail, useReplay } from '@/lib/client/hooks';
import { useConsoleStore } from '@/lib/client/store';
import { useEventStream } from '@/lib/client/use-event-stream';
import { useOrigin } from '@/lib/client/site';

export function Console(): React.JSX.Element {
  const origin = useOrigin();
  const { data, isLoading } = useEndpoints();
  const endpoints = useMemo(() => data?.endpoints ?? [], [data]);
  const selectedEndpointId = useConsoleStore((state) => state.selectedEndpointId);
  const selectEndpoint = useConsoleStore((state) => state.selectEndpoint);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const endpoint = endpoints.find((item) => item.id === selectedEndpointId) ?? null;

  useEffect(() => {
    if (!selectedEndpointId && endpoints.length > 0) selectEndpoint(endpoints[0].id);
  }, [selectedEndpointId, endpoints, selectEndpoint]);

  useEffect(() => {
    setSelectedEventId(null);
  }, [selectedEndpointId]);

  const { events, connected } = useEventStream(
    endpoint ? `/api/endpoints/${endpoint.id}/stream` : null,
  );

  useEffect(() => {
    if (selectedEventId === null && events.length > 0) setSelectedEventId(events[0].id);
  }, [events, selectedEventId]);

  const detail = useEventDetail(selectedEventId);
  const clear = useClearEvents();
  const replay = useReplay();
  const selectedEvent = events.find((item) => item.id === selectedEventId) ?? null;

  if (isLoading) {
    return (
      <div className="grid h-[60vh] place-items-center">
        <Spinner size={18} />
      </div>
    );
  }

  if (!endpoint) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-[15px] text-ink">No endpoint selected</p>
        <p className="max-w-sm text-[13px] text-ink-2">
          Create an endpoint from the sidebar, then point a webhook at its URL.
        </p>
      </div>
    );
  }

  const ingestBase = `${origin}/in/${endpoint.slug}`;
  const forwardUrl = endpoint.forwardUrl;
  const canReplay = forwardUrl !== null;

  const runReplay = (): void => {
    if (!selectedEvent || !forwardUrl) return;
    replay.mutate({ eventId: selectedEvent.id, targetUrl: forwardUrl });
  };

  return (
    <div className="flex h-[calc(100dvh-56px)] flex-col">
      <div className="flex flex-col gap-3 border-b border-line px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex items-center gap-2.5">
            <h1 className="truncate text-[15px] font-medium text-ink">{endpoint.name}</h1>
            {endpoint.forwardEnabled && (
              <span className="chip !py-0.5 text-[10px] text-[var(--accent)]">relaying</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <code className="truncate font-mono text-[11px] text-ink-3">{ingestBase}</code>
            <CopyButton label="" value={ingestBase} />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            className="btn btn-ghost !py-1.5 text-[12px]"
            onClick={() => clear.mutate(endpoint.id)}
            type="button"
          >
            <Broom size={14} />
            Clear
          </button>
          <button
            className="btn btn-ghost !py-1.5 text-[12px]"
            onClick={() => setSettingsOpen(true)}
            type="button"
          >
            <Gear size={14} />
            Settings
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-[220px_1fr] lg:grid-cols-[340px_1fr] lg:grid-rows-1">
        <div className="min-h-0 border-b border-line lg:border-r lg:border-b-0">
          <EventList
            connected={connected}
            emptyLabel={`Send a request to /in/${endpoint.slug} to see it here…`}
            events={events}
            onSelect={setSelectedEventId}
            selectedId={selectedEventId}
          />
        </div>

        <div className="min-h-0">
          {selectedEvent ? (
            <EventDetail
              actions={
                <>
                  <button
                    className="btn btn-ghost !py-1.5 text-[12px]"
                    disabled={replay.isPending || !canReplay}
                    onClick={runReplay}
                    title={canReplay ? undefined : 'Set a forward URL in settings to replay'}
                    type="button"
                  >
                    {replay.isPending ? <Spinner /> : <ArrowClockwise size={14} />}
                    {canReplay ? 'Replay to forward URL' : 'No forward URL set'}
                  </button>
                  {replay.isSuccess && (
                    <span className="font-mono text-[11px] text-ink-3">
                      {replay.data.delivery.status} · {replay.data.delivery.statusCode ?? '—'}
                    </span>
                  )}
                  {replay.isError && (
                    <span className="font-mono text-[11px] text-[var(--danger)]">
                      {replay.error.message}
                    </span>
                  )}
                </>
              }
              deliveries={detail.data?.deliveries ?? []}
              event={selectedEvent}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <p className="font-mono text-[11px] tracking-wider text-ink-3 uppercase">
                {events.length === 0 ? 'waiting for traffic' : 'no request selected'}
              </p>
              <p className="max-w-xs text-[13px] leading-relaxed text-ink-2">
                Requests to this endpoint appear on the left the moment they arrive.
              </p>
            </div>
          )}
        </div>
      </div>

      {settingsOpen && (
        <EndpointSettings endpoint={endpoint} onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}
