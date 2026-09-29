# Hookbay

A webhook inbox you can actually read. Give any webhook a URL, watch the raw request arrive in
real time, inspect every header and byte, then replay or relay it to your real endpoint.

Built in one session as a DeepSeek V4.1 capability showcase on the OpenCode harness.

- Live sandbox: `https://gw-4310.dikicodes.com/demo`
- Docs: `https://gw-4310.dikicodes.com/docs`
- Health: `https://gw-4310.dikicodes.com/api/health`

## What it does

- **Capture anything.** Each endpoint gets a public URL under `/in/{slug}` that accepts every HTTP
  method and stores the method, path, query string, all headers, the raw body, content type, byte
  size, and source IP.
- **Stream live.** Captured requests broadcast over Server-Sent Events. The console shows them the
  moment the server receives them — no polling, no refresh.
- **Replay on demand.** Re-send a stored request to any target URL, or to the endpoint's forward
  URL, and keep the result.
- **Relay with retries.** Point an endpoint at your real service and Hookbay forwards every capture
  with signed headers and retries at 0s, 1.5s, and 5s. Every attempt records status, duration, and
  error.
- **Plans that mean something.** Free keeps 4 endpoints at 300 requests each; Pro raises that to 25
  and 5,000. The limits are enforced in the API, and you can switch plans from the console.

## Quickstart

```bash
pnpm install
pnpm dev            # http://localhost:4310
```

Send a request to the public sandbox:

```bash
curl -X POST http://localhost:4310/in/demo \
  -H "content-type: application/json" \
  -d '{"hello":"world"}'
```

Then open `http://localhost:4310/demo` and watch the row appear.

### Environment

| Variable                | Default              | Purpose                                   |
| ----------------------- | -------------------- | ----------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`  | `http://localhost:4310` | Absolute origin used in curl snippets  |
| `HOOKBAY_DB`            | `./data/hookbay.db`  | SQLite database path                      |
| `PORT`                  | `4310`               | Server port (`next start -p`)             |

## Architecture

```
provider ──POST──▶ /in/{slug} ──▶ SQLite + in-process event bus ──SSE──▶ browser console
                                        │
                                        └──▶ relay (fetch, retries, signed headers) ──▶ your service
```

- **Next.js 15** (App Router, React 19, strict TypeScript). Server Components for static layout,
  client components for the live console.
- **SQLite via `node:sqlite`.** No native module, no external database. The schema is created on
  first import and includes a seeded public sandbox endpoint.
- **In-process event bus.** An `EventEmitter` keyed by endpoint id carries captures from the ingest
  route to open SSE streams. One long-lived HTTP response per viewer.
- **Post-response relay.** Ingest uses Next's `after()` to forward requests without holding the
  provider's connection open.
- **Background simulator.** When someone is watching the sandbox, a timer emits realistic sample
  webhooks (Stripe, GitHub, Shopify, and others) so the live demo always has movement. The timer is
  `unref()`ed so it never keeps a build or short-lived process alive.

### Data model

`users`, `workspaces`, `sessions`, `endpoints`, `events`, `deliveries`. Every resource is scoped to
a workspace, so the app is multi-tenant from the first migration. See `src/lib/db.ts`.

## HTTP API

The full reference lives at `/docs`. Summary:

| Method | Path                          | Purpose                              | Auth    |
| ------ | ----------------------------- | ------------------------------------ | ------- |
| ANY    | `/in/{slug}`                  | Capture a request                    | public  |
| GET    | `/api/endpoints`              | List endpoints with stats            | session |
| POST   | `/api/endpoints`              | Create an endpoint                   | session |
| PATCH  | `/api/endpoints/{id}`         | Rename, set relay, rotate secret     | session |
| DELETE | `/api/endpoints/{id}`         | Delete an endpoint                   | session |
| GET    | `/api/endpoints/{id}/events`  | Recent captures                      | session |
| GET    | `/api/endpoints/{id}/stream`  | SSE stream of captures               | session |
| GET    | `/api/events/{id}`            | One capture with delivery attempts   | session |
| POST   | `/api/events/{id}/replay`     | Replay a capture                     | session |
| GET    | `/api/health`                 | Service health and counters          | public  |

Responses follow JSend: `{ "status": "success", "data": … }` or
`{ "status": "error", "message": …, "code": …, "errors": […] }`.

## Testing

```bash
pnpm test        # vitest: unit + integration (data layer, relay retries, formatting)
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint
pnpm build       # production build
```

The test suite covers password hashing, slug generation, JSON highlighting (including HTML
escaping), the SQLite repositories (accounts, sessions, endpoints, events, retention, deliveries),
and the relay (success, retry-then-succeed, permanent failure, blocked metadata target, replay).

## Operations

The app runs as a systemd service on port 4310, with a Cloudflare tunnel publishing it.

```bash
pnpm build
systemctl restart hookbay
curl -s localhost:4310/api/health
```

The database lives at `data/hookbay.db` and is excluded from git. Delete it to start from a clean
seed.

## Project structure

```
src/app          routes (landing, auth, console, sandbox, docs) and API handlers
src/components   marketing, dashboard, inspector, and UI primitives
src/lib          database, auth, ingest, relay, event bus, SSE, simulator
tests            vitest suites
```

## Status and limits

- Billing is not wired up. The pricing page is real copy, but plan changes happen from the console
  as a preview.
- Ingest bodies are stored up to 128 KB; larger payloads are truncated and flagged in the receipt.
- Ingest is rate limited to 300 requests per minute per endpoint.
- Relay blocks cloud metadata addresses. It will forward to any other HTTP(S) target.
- Sessions are stored in SQLite with a 30-day, httpOnly cookie.
