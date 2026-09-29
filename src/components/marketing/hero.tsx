'use client';

import Link from 'next/link';
import { ArrowRight, CursorClick, WebhooksLogo } from '@phosphor-icons/react/dist/ssr';
import { RequestFeed } from '@/components/live/request-feed';
import { CopyButton, Magnetic } from '@/components/ui/interactive';
import { KineticHeading, Reveal } from '@/components/ui/motion';
import { Chip, StatusDot } from '@/components/ui/primitives';
import { useOrigin } from '@/lib/client/site';

export function Hero(): React.JSX.Element {
  const origin = useOrigin();
  const demoUrl = `${origin}/in/demo`;
  const curl = `curl -X POST ${demoUrl} -H "content-type: application/json" -d '{"hello":"world"}'`;

  return (
    <section className="relative overflow-hidden border-b border-line">
      <div aria-hidden className="grid-layer pointer-events-none absolute inset-0" />
      <div className="relative mx-auto grid max-w-[1240px] items-center gap-14 px-5 pt-20 pb-16 md:pt-24 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
        <div className="flex flex-col items-start gap-6">
          <Chip tone="accent">
            <StatusDot />
            live webhook inbox
          </Chip>

          <KineticHeading
            className="max-w-[15ch] text-[2.6rem] leading-[1.04] font-semibold tracking-tight text-ink sm:text-5xl lg:text-[3.6rem]"
            text="See every webhook the moment it lands."
          />

          <p className="max-w-[52ch] text-[15px] leading-relaxed text-ink-2">
            Give any webhook a URL. Watch the raw request arrive, inspect every header, replay it,
            and relay it to your real endpoint.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Magnetic>
              <Link className="btn btn-primary" href="/signup">
                Start free
                <ArrowRight size={15} weight="bold" />
              </Link>
            </Magnetic>
            <Link className="btn btn-ghost" href="/demo">
              <CursorClick size={15} />
              Open live sandbox
            </Link>
          </div>

          <div className="mt-1 w-full max-w-[520px]">
            <div className="flex items-center gap-2 rounded-xl border border-line bg-bg-off py-2 pr-1.5 pl-3">
              <WebhooksLogo className="shrink-0 text-ink-3" size={15} />
              <code className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-ink-2">
                curl -X POST {demoUrl}
              </code>
              <CopyButton label="copy" value={curl} />
            </div>
          </div>
        </div>

        <Reveal className="w-full" delay={0.1}>
          <div className="panel overflow-hidden shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]">
            <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="flex gap-1.5" aria-hidden>
                  <span className="h-2 w-2 rounded-full bg-line-strong" />
                  <span className="h-2 w-2 rounded-full bg-line-strong" />
                  <span className="h-2 w-2 rounded-full bg-line-strong" />
                </span>
                <span className="ml-1 font-mono text-[11px] text-ink-2">/in/demo</span>
              </div>
              <span className="font-mono text-[10px] tracking-[0.16em] text-ink-3 uppercase">
                sandbox
              </span>
            </div>
            <div className="h-[352px]">
              <RequestFeed
                emptyLabel="Send a request to see it here…"
                streamUrl="/api/demo/stream"
                variant="compact"
              />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-line bg-bg-off px-3 py-2.5">
              <span className="font-mono text-[11px] text-ink-3">
                real requests · streamed over SSE
              </span>
              <div className="flex items-center gap-1">
                <CopyButton label="copy url" value={demoUrl} />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
