'use client';

import { useState } from 'react';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react/dist/ssr';
import { CopyButton } from '@/components/ui/interactive';
import { JsonBlock, KeyValue, MethodBadge } from '@/components/ui/primitives';
import { useOrigin } from '@/lib/client/site';
import { formatBytes, fullTime, prettyBody, truncate } from '@/lib/format';
import type { Delivery, EventRecord } from '@/lib/types';

const TABS = ['body', 'headers', 'query', 'meta'] as const;
type Tab = (typeof TABS)[number];

const SKIP_HEADERS = new Set([
  'host',
  'content-length',
  'connection',
  'accept-encoding',
  'postman-token',
]);

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function buildCurl(event: EventRecord, origin: string): string {
  const query = new URLSearchParams(event.query).toString();
  const url = `${origin}${event.path}${query.length > 0 ? `?${query}` : ''}`;
  const parts = [`curl -X ${event.method} ${shellQuote(url)}`];
  for (const [key, value] of Object.entries(event.headers)) {
    if (SKIP_HEADERS.has(key.toLowerCase())) continue;
    parts.push(`-H ${shellQuote(`${key}: ${value}`)}`);
  }
  if (event.body.length > 0 && event.method !== 'GET' && event.method !== 'HEAD') {
    parts.push(`-d ${shellQuote(event.body)}`);
  }
  return parts.join(' \\\n  ');
}

export function EventDetail({
  event,
  deliveries = [],
  actions,
}: {
  event: EventRecord;
  deliveries?: Delivery[];
  actions?: React.ReactNode;
}): React.JSX.Element {
  const [tab, setTab] = useState<Tab>('body');
  const origin = useOrigin();
  const body = prettyBody(event.body, event.contentType);
  const curl = buildCurl(event, origin);
  const headerEntries = Object.entries(event.headers);
  const queryEntries = Object.entries(event.query);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col gap-3 border-b border-line px-4 py-3.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <MethodBadge method={event.method} />
          <span className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-ink">
            {truncate(event.path, 60)}
            {queryEntries.length > 0 && (
              <span className="text-ink-3">?{new URLSearchParams(event.query).toString()}</span>
            )}
          </span>
          <CopyButton label="curl" value={curl} />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10.5px] text-ink-3">
          <span>id {event.id.slice(0, 8)}</span>
          <span>{formatBytes(event.bodySize)}</span>
          <span>{event.contentType ?? 'no content-type'}</span>
          <span>{event.ip ?? 'unknown ip'}</span>
          <span className="text-ink-2">{fullTime(event.receivedAt)}</span>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

      <div className="flex items-center gap-1 border-b border-line px-2 py-1.5">
        {TABS.map((item) => (
          <button
            className={`rounded-md px-2.5 py-1 font-mono text-[11px] tracking-wider uppercase transition-colors ${
              tab === item ? 'bg-mono-bg text-ink' : 'text-ink-3 hover:text-ink-2'
            }`}
            key={item}
            onClick={() => setTab(item)}
            type="button"
          >
            {item}
            {item === 'headers' && <span className="ml-1 text-ink-3">{headerEntries.length}</span>}
            {item === 'query' && queryEntries.length > 0 && (
              <span className="ml-1 text-ink-3">{queryEntries.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'body' && (
          <div className="bg-bg-off">
            {body.length > 0 ? (
              <JsonBlock content={body} />
            ) : (
              <p className="px-4 py-6 font-mono text-[12px] text-ink-3">
                This request carried no body.
              </p>
            )}
          </div>
        )}

        {tab === 'headers' && (
          <div className="px-4 py-1">
            {headerEntries.length === 0 && (
              <p className="py-5 font-mono text-[12px] text-ink-3">No headers captured.</p>
            )}
            {headerEntries.map(([key, value]) => (
              <KeyValue key={key} label={key} value={value} />
            ))}
          </div>
        )}

        {tab === 'query' && (
          <div className="px-4 py-1">
            {queryEntries.length === 0 && (
              <p className="py-5 font-mono text-[12px] text-ink-3">No query parameters.</p>
            )}
            {queryEntries.map(([key, value]) => (
              <KeyValue key={key} label={key} value={value} />
            ))}
          </div>
        )}

        {tab === 'meta' && (
          <div className="flex flex-col">
            <div className="px-4 py-1">
              <KeyValue label="event id" value={event.id} />
              <KeyValue label="endpoint" value={event.endpointId} />
              <KeyValue label="received" value={fullTime(event.receivedAt)} />
              <KeyValue label="source ip" value={event.ip ?? 'unknown'} />
              <KeyValue label="content type" value={event.contentType ?? '—'} />
              <KeyValue
                label="body size"
                value={`${formatBytes(event.bodySize)} (${event.bodySize} bytes)`}
              />
            </div>
            <div className="border-t border-line">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="font-mono text-[11px] tracking-wider text-ink-2 uppercase">
                  deliveries
                </span>
                <span className="font-mono-num text-[11px] text-ink-3">{deliveries.length}</span>
              </div>
              {deliveries.length === 0 && (
                <p className="px-4 pb-4 font-mono text-[11px] text-ink-3">
                  No relay or replay attempts recorded for this request.
                </p>
              )}
              {deliveries.map((delivery) => (
                <div
                  className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-2.5"
                  key={delivery.id}
                >
                  {delivery.status === 'success' ? (
                    <CheckCircle className="text-[var(--success)]" size={15} weight="fill" />
                  ) : (
                    <WarningCircle className="text-[var(--danger)]" size={15} weight="fill" />
                  )}
                  <span className="font-mono text-[11px] text-ink-2">
                    {delivery.trigger} · attempt {delivery.attempt}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-ink-3">
                    {delivery.error ?? delivery.targetUrl}
                  </span>
                  <span
                    className={`font-mono text-[11px] ${
                      delivery.status === 'success'
                        ? 'text-[var(--success)]'
                        : 'text-[var(--danger)]'
                    }`}
                  >
                    {delivery.statusCode ?? '—'}
                  </span>
                  <span className="font-mono-num text-[10.5px] text-ink-3">
                    {delivery.durationMs ?? 0} ms
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
