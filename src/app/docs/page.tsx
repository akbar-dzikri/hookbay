import type { Metadata } from 'next';
import { CopyButton } from '@/components/ui/interactive';
import { JsonBlock } from '@/components/ui/primitives';
import { SiteFooter } from '@/components/site/footer';
import { SiteNav } from '@/components/site/nav';

export const metadata: Metadata = {
  title: 'Docs',
  description: 'The Hookbay ingest contract, relay behaviour, and HTTP API.',
};

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gw-4310.dikicodes.com';

function CodeCard({
  title,
  code,
  tone = 'default',
}: {
  title: string;
  code: string;
  tone?: 'default' | 'muted';
}): React.JSX.Element {
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <div
        className={`flex items-center justify-between border-b border-line px-3.5 py-2 ${
          tone === 'muted' ? 'bg-bg-off' : 'bg-surface-2'
        }`}
      >
        <span className="font-mono text-[11px] text-ink-2">{title}</span>
        <CopyButton label="copy" value={code} />
      </div>
      <div className="bg-bg-off">
        <JsonBlock content={code} />
      </div>
    </div>
  );
}

const SECTIONS = [
  { id: 'quickstart', label: 'Quickstart' },
  { id: 'ingest', label: 'Ingest contract' },
  { id: 'relay', label: 'Relay & replay' },
  { id: 'api', label: 'HTTP API' },
  { id: 'errors', label: 'Errors & limits' },
];

const ROUTES: { method: string; path: string; description: string; auth: string }[] = [
  { method: 'POST', path: '/in/{slug}', description: 'Capture any request', auth: 'public' },
  {
    method: 'GET',
    path: '/api/endpoints',
    description: 'List endpoints with stats',
    auth: 'session',
  },
  { method: 'POST', path: '/api/endpoints', description: 'Create an endpoint', auth: 'session' },
  {
    method: 'PATCH',
    path: '/api/endpoints/{id}',
    description: 'Rename, set relay, rotate secret',
    auth: 'session',
  },
  {
    method: 'DELETE',
    path: '/api/endpoints/{id}',
    description: 'Delete an endpoint',
    auth: 'session',
  },
  {
    method: 'GET',
    path: '/api/endpoints/{id}/events',
    description: 'Recent captured requests',
    auth: 'session',
  },
  {
    method: 'DELETE',
    path: '/api/endpoints/{id}/events',
    description: 'Clear captured requests',
    auth: 'session',
  },
  {
    method: 'GET',
    path: '/api/endpoints/{id}/stream',
    description: 'Server-Sent Events stream',
    auth: 'session',
  },
  {
    method: 'GET',
    path: '/api/events/{id}',
    description: 'One request with delivery attempts',
    auth: 'session',
  },
  {
    method: 'POST',
    path: '/api/events/{id}/replay',
    description: 'Replay to a target URL',
    auth: 'session',
  },
  {
    method: 'GET',
    path: '/api/health',
    description: 'Service health and counters',
    auth: 'public',
  },
];

export default function DocsPage(): React.JSX.Element {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteNav />
      <main className="mx-auto flex w-full max-w-[1240px] flex-1 gap-12 px-5 py-12">
        <aside className="sticky top-24 hidden h-fit w-48 shrink-0 flex-col gap-2 lg:flex">
          {SECTIONS.map((section) => (
            <a
              className="text-[13px] text-ink-2 transition-colors hover:text-ink"
              href={`#${section.id}`}
              key={section.id}
            >
              {section.label}
            </a>
          ))}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-14">
          <header className="flex flex-col gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[2rem]">
              Hookbay docs
            </h1>
            <p className="max-w-[70ch] text-[14px] leading-relaxed text-ink-2">
              One ingest URL per endpoint. Everything else is a thin HTTP API over the requests it
              captures. Base URL: <code className="font-mono text-ink">{BASE}</code>
            </p>
          </header>

          <section className="flex flex-col gap-5" id="quickstart">
            <h2 className="text-xl font-semibold tracking-tight text-ink">Quickstart</h2>
            <p className="max-w-[70ch] text-[13.5px] leading-relaxed text-ink-2">
              Create an endpoint in the console, then send it anything. The public sandbox endpoint
              is always available at <code className="font-mono text-ink">/in/demo</code> if you
              want to try before signing up.
            </p>
            <CodeCard
              code={`curl -X POST ${BASE}/in/demo \\
  -H "content-type: application/json" \\
  -d '{"event":"invoice.paid","amount":4200}'`}
              title="send a request"
            />
            <CodeCard
              code={`{
  "status": "success",
  "data": {
    "id": "9f2c1a44-...",
    "endpoint": "demo",
    "receivedAt": "2026-09-29T08:40:12.104Z",
    "truncated": false,
    "relayed": false
  }
}`}
              title="202 accepted"
              tone="muted"
            />
          </section>

          <section className="flex flex-col gap-5" id="ingest">
            <h2 className="text-xl font-semibold tracking-tight text-ink">Ingest contract</h2>
            <ul className="flex flex-col gap-3 text-[13.5px] leading-relaxed text-ink-2">
              <li>
                <span className="text-ink">Any method.</span> GET, POST, PUT, PATCH, DELETE, HEAD,
                and OPTIONS are all captured. OPTIONS returns 204 without recording, for CORS
                preflight.
              </li>
              <li>
                <span className="text-ink">What is stored.</span> Method, path, query string, all
                request headers, the raw body, content type, byte size, and the source IP.
              </li>
              <li>
                <span className="text-ink">Size limit.</span> Bodies up to 128 KB are stored in
                full; larger payloads are truncated and flagged in the receipt.
              </li>
              <li>
                <span className="text-ink">CORS.</span> Ingest responses allow any origin, so
                browser clients can post directly.
              </li>
            </ul>
            <CodeCard
              code={`# open the URL in a browser and you get a human page
open ${BASE}/in/demo`}
              title="browser friendly"
              tone="muted"
            />
          </section>

          <section className="flex flex-col gap-5" id="relay">
            <h2 className="text-xl font-semibold tracking-tight text-ink">Relay &amp; replay</h2>
            <p className="max-w-[70ch] text-[13.5px] leading-relaxed text-ink-2">
              Set a forwarding URL on an endpoint and every captured request is relayed to it.
              Failed deliveries are retried at 0s, 1.5s, and 5s, and each attempt is recorded with
              its status code, duration, and error. Replays are separate attempts, so you can
              re-send a stored request without waiting for a new one.
            </p>
            <CodeCard
              code={`# relayed headers added to every forward
X-Hookbay-Event-Id: 9f2c1a44-...
X-Hookbay-Delivery: relay
X-Hookbay-Signature: sha256=1a2b3c4d`}
              title="signed forwards"
              tone="muted"
            />
            <CodeCard
              code={`curl -X POST ${BASE}/api/events/9f2c1a44-.../replay \\
  -H "content-type: application/json" \\
  -d '{"targetUrl":"https://example.com/hook"}'`}
              title="replay a stored request"
            />
          </section>

          <section className="flex flex-col gap-5" id="api">
            <h2 className="text-xl font-semibold tracking-tight text-ink">HTTP API</h2>
            <div className="overflow-hidden rounded-xl border border-line">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-surface-2">
                    <th className="px-4 py-2.5 font-mono text-[10.5px] tracking-wider text-ink-3 uppercase">
                      Method
                    </th>
                    <th className="px-3 py-2.5 font-mono text-[10.5px] tracking-wider text-ink-3 uppercase">
                      Path
                    </th>
                    <th className="px-3 py-2.5 font-mono text-[10.5px] tracking-wider text-ink-3 uppercase">
                      Description
                    </th>
                    <th className="hidden px-4 py-2.5 text-right font-mono text-[10.5px] tracking-wider text-ink-3 uppercase sm:table-cell">
                      Auth
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ROUTES.map((route) => (
                    <tr
                      className="border-b border-line last:border-b-0"
                      key={`${route.method}-${route.path}`}
                    >
                      <td className="px-4 py-2.5 font-mono text-[11px] text-[var(--accent)]">
                        {route.method}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[12px] text-ink">{route.path}</td>
                      <td className="px-3 py-2.5 text-[12.5px] text-ink-2">{route.description}</td>
                      <td className="hidden px-4 py-2.5 text-right font-mono text-[11px] text-ink-3 sm:table-cell">
                        {route.auth}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[12.5px] text-ink-3">
              Session routes authenticate with the{' '}
              <code className="font-mono">hookbay_session</code> cookie set at sign-in. The SSE
              stream emits one <code className="font-mono">request</code> event per capture.
            </p>
          </section>

          <section className="flex flex-col gap-5" id="errors">
            <h2 className="text-xl font-semibold tracking-tight text-ink">Errors &amp; limits</h2>
            <p className="max-w-[70ch] text-[13.5px] leading-relaxed text-ink-2">
              Error responses follow a single shape, so a client only needs one branch.
            </p>
            <CodeCard
              code={`{
  "status": "error",
  "message": "Validation failed",
  "code": "ERR_VALIDATION",
  "errors": [{ "field": "email", "message": "Enter a valid email address" }]
}`}
              title="error shape"
              tone="muted"
            />
            <div className="overflow-hidden rounded-xl border border-line">
              <table className="w-full border-collapse text-left">
                <tbody>
                  {[
                    ['Ingest rate limit', '300 requests per minute, per endpoint'],
                    ['Body stored', '128 KB, then truncated'],
                    ['Free plan', '4 endpoints · 300 requests kept per endpoint'],
                    ['Pro plan', '25 endpoints · 5,000 requests kept per endpoint'],
                    ['Relay timeout', '10 seconds per attempt'],
                  ].map(([key, value]) => (
                    <tr className="border-b border-line last:border-b-0" key={key}>
                      <td className="w-48 px-4 py-2.5 font-mono text-[11px] tracking-wider text-ink-3 uppercase">
                        {key}
                      </td>
                      <td className="px-3 py-2.5 text-[13px] text-ink-2">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
