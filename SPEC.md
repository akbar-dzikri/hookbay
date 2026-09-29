# Hookbay — build spec

The one-page record of how this project was conceived, so the reasoning is reviewable.

## The problem

Webhooks are the worst part of every integration. A provider says "delivered", your handler says
nothing arrived, and the only debugging tools are a log line and guesswork. Existing options are
either throwaway (a request bin that forgets everything) or heavyweight (a full event platform you
have to operate). There is a gap for a small, self-contained inbox that captures the raw request,
shows it live, and hands it back to your real service.

## The product

Hookbay is a hosted webhook inbox. Each endpoint has a public URL that accepts any method and stores
the request exactly as it arrived. The console streams captures live, and any capture can be replayed
or relayed to a real endpoint with retries.

The public sandbox (`/in/demo`) is central to the product, not decoration: a visitor can send a
request before signing up and watch it land. That proves the core loop in five seconds.

## Who it is for

Developers wiring up Stripe, GitHub, Shopify, and friends, who need to see what the provider
actually sent instead of what the docs say it sends.

## Scope decisions

In scope: endpoints with unique URLs, raw capture, live SSE streaming, replay, relay with retry and
signed headers, public sandbox, accounts and workspaces, plan limits, docs, health endpoint.

Deliberately out of scope: billing, team invitations, email notifications, API keys for
programmatic reads, and a Kubernetes-grade delivery queue. Each is a real feature; none is needed to
prove the loop.

## Key technical decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Runtime | Next.js 15 on Node | One process serves UI and API; `after()` gives clean post-response work. |
| Database | SQLite via `node:sqlite` | Zero native build, one file, transactional. Removes an entire class of deploy risk. |
| Live updates | Server-Sent Events | One-directional, works through proxies with `X-Accel-Buffering: no`, trivial to consume. |
| Fan-out | In-process `EventEmitter` | Single instance, no broker. Correct for this scale; a Redis pub/sub would be the first upgrade. |
| Relay | `fetch` with 0s/1.5s/5s retries | Honest, auditable retry policy with a recorded attempt per try. |
| Auth | scrypt + hashed session tokens | No dependency, no plaintext, timing-safe comparison. |
| Styling | Tailwind v4 + CSS variables | One token set drives both themes. |

## Risks taken and how they were handled

- **Build hung after the first release.** A background `setInterval` kept the Node process alive.
  Fixed with `timer.unref()` and a build-phase guard in `instrumentation.ts`. Caught by the test
  build, covered by design.
- **Ordering ties.** Events created inside the same millisecond could reorder. Fixed by adding
  `rowid` as a tiebreaker in every ordered query.
- **Payload injection.** Captured bodies are rendered as highlighted JSON; the highlighter escapes
  HTML first. There is a test asserting `<script>` cannot survive.

## Definition of done

- `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` all pass.
- A new visitor can sign up, create an endpoint, send a request, and see it stream in.
- The replay flow records a delivery with a real status code.
- The sandbox is reachable from the public internet.
