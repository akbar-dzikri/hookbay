'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowClockwise,
  Broadcast,
  Funnel,
  Lightning,
  PlugsConnected,
  Terminal,
} from '@phosphor-icons/react/dist/ssr';
import { CopyButton, Magnetic } from '@/components/ui/interactive';
import { Reveal } from '@/components/ui/motion';
import { JsonBlock, StatusDot } from '@/components/ui/primitives';
import { useOrigin } from '@/lib/client/site';

const SOURCES = [
  'stripe',
  'github',
  'shopify',
  'square',
  'pagerduty',
  'linear',
  'vercel',
  'netlify',
];

export function SourceStrip(): React.JSX.Element {
  return (
    <section className="border-b border-line bg-bg-off">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center sm:gap-10">
        <p className="shrink-0 text-[13px] text-ink-3">
          Catches webhooks from the services you already use
        </p>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          {SOURCES.map((slug) => (
            <Image
              alt={slug}
              className="opacity-45 transition-opacity hover:opacity-90"
              height={20}
              key={slug}
              src={`https://cdn.simpleicons.org/${slug}/888888`}
              unoptimized
              width={20}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionIntro({
  eyebrow,
  title,
  body,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      {eyebrow && (
        <span className="font-mono text-[11px] tracking-[0.18em] text-[var(--accent-dim)] uppercase">
          {eyebrow}
        </span>
      )}
      <h2 className="max-w-[22ch] text-2xl font-semibold tracking-tight text-ink sm:text-[2rem]">
        {title}
      </h2>
      {body && <p className="max-w-[62ch] text-[14px] leading-relaxed text-ink-2">{body}</p>}
    </div>
  );
}

const STEPS = [
  {
    title: 'Create an endpoint',
    body: 'Hookbay mints a URL and a signing secret. Nothing to install, no tunnel to keep open.',
  },
  {
    title: 'Point your provider at it',
    body: 'Paste the URL into Stripe, GitHub, or your own service. Every method is accepted.',
  },
  {
    title: 'Inspect, replay, relay',
    body: 'Read the raw request live, then send it onward to your real endpoint with retries.',
  },
];

export function HowItWorks(): React.JSX.Element {
  const origin = useOrigin();
  const url = `${origin}/in/demo`;
  const transcript = `$ curl -X POST ${url} \\
    -H "content-type: application/json" \\
    -d '{"event":"invoice.paid","amount":4200}'

HTTP/2 202
{"status":"success","data":{"endpoint":"demo","relayed":true}}`;

  return (
    <section className="border-b border-line" id="how">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-5 py-20 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
        <div className="flex flex-col gap-8">
          <SectionIntro
            body="Three steps from a provider dashboard to a readable request. Hookbay holds the inbox, so your laptop can stay closed."
            eyebrow="How it works"
            title="From webhook to readable request in three steps"
          />
          <ol className="flex flex-col">
            {STEPS.map((step, index) => (
              <li className="flex gap-5 border-t border-line py-5" key={step.title}>
                <span className="font-mono text-[12px] text-[var(--accent-dim)]">0{index + 1}</span>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-[15px] font-medium text-ink">{step.title}</h3>
                  <p className="max-w-[46ch] text-[13.5px] leading-relaxed text-ink-2">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <Reveal className="lg:pt-4" delay={0.08}>
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
              <span className="flex items-center gap-2 font-mono text-[11px] text-ink-2">
                <Terminal size={14} />
                your terminal
              </span>
              <CopyButton label="copy" value={transcript} />
            </div>
            <JsonBlock content={transcript} />
            <div className="border-t border-line bg-bg-off px-4 py-3.5">
              <p className="font-mono text-[11px] leading-relaxed text-ink-3">
                The response is a receipt. The full request — method, query, every header, the exact
                body — is waiting in the console.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function BentoCell({
  title,
  body,
  icon,
  children,
  className = '',
}: {
  title: string;
  body: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <div className={`panel flex flex-col gap-3 overflow-hidden p-5 ${className}`}>
      <span className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-surface-2 text-ink-2">
        {icon}
      </span>
      <h3 className="text-[15px] font-medium text-ink">{title}</h3>
      <p className="text-[13px] leading-relaxed text-ink-2">{body}</p>
      {children}
    </div>
  );
}

export function Features(): React.JSX.Element {
  const captured = JSON.stringify(
    {
      'stripe-signature': 't=1761780000,v1=7f3c…',
      'content-type': 'application/json',
      'user-agent': 'Stripe/1.0',
      'x-forwarded-for': '54.187.174.169',
    },
    null,
    2,
  );

  return (
    <section className="border-b border-line">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-10 px-5 py-20">
        <SectionIntro
          title="Built for the request, not just the log line"
          body="Most tools show you that something happened. Hookbay shows you exactly what arrived."
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <BentoCell
            body="Every captured request streams to the console the instant it lands. One long-lived connection, no polling, no refresh."
            className="md:col-span-4"
            icon={<Broadcast size={16} />}
            title="Live stream, no refresh button"
          >
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-line bg-bg-off px-3 py-2">
              <StatusDot />
              <code className="truncate font-mono text-[11px] text-ink-2">
                EventSource(&apos;/api/endpoints/:id/stream&apos;)
              </code>
            </div>
          </BentoCell>

          <BentoCell
            body="Re-send any captured request to a new target with one click, or straight from the API."
            className="md:col-span-2"
            icon={<ArrowClockwise size={16} />}
            title="Replay on demand"
          />

          <BentoCell
            body="Forward every request to your real endpoint with signed headers and automatic retries."
            className="md:col-span-2"
            icon={<PlugsConnected size={16} />}
            title="Relay with retries"
          >
            <div className="mt-1 flex items-center gap-1.5" aria-hidden>
              <span className="font-mono text-[10px] text-[var(--danger)]">500</span>
              <span className="h-px w-4 bg-line-strong" />
              <span className="font-mono text-[10px] text-[var(--danger)]">500</span>
              <span className="h-px w-4 bg-line-strong" />
              <span className="font-mono text-[10px] text-[var(--success)]">200</span>
            </div>
          </BentoCell>

          <BentoCell
            body="Query string, headers, body, content type, source IP, timing. Stored as raw text so nothing is lost to parsing."
            className="md:col-span-4"
            icon={<Funnel size={16} />}
            title="The raw truth, preserved"
          >
            <div className="mt-1 overflow-hidden rounded-lg border border-line bg-bg-off">
              <JsonBlock content={captured} />
            </div>
          </BentoCell>

          <BentoCell
            body="Free endpoints keep the last 300 requests and trim themselves. Pro keeps 5,000. Nothing to clean up by hand."
            className="md:col-span-6"
            icon={<Lightning size={16} />}
            title="History that maintains itself"
          />
        </div>
      </div>
    </section>
  );
}

const DELIVERY_ROWS = [
  {
    method: 'POST',
    path: '/api/echo',
    status: 'failed',
    code: '500',
    ms: '148 ms',
    note: 'target error',
  },
  {
    method: 'POST',
    path: '/api/echo',
    status: 'failed',
    code: '500',
    ms: '96 ms',
    note: 'target error',
  },
  {
    method: 'POST',
    path: '/api/echo',
    status: 'success',
    code: '200',
    ms: '212 ms',
    note: 'delivered',
  },
];

export function RelaySection(): React.JSX.Element {
  return (
    <section className="border-b border-line bg-bg-off">
      <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="font-mono text-[11px] tracking-[0.14em] text-ink-2 uppercase">
                delivery log
              </span>
              <span className="chip">example</span>
            </div>
            <table className="w-full border-collapse text-left">
              <tbody>
                {DELIVERY_ROWS.map((row, index) => (
                  <tr className="border-b border-line last:border-b-0" key={index}>
                    <td className="px-4 py-3 font-mono text-[11px] text-ink-3">#{index + 1}</td>
                    <td className="px-3 py-3 font-mono text-[12px] text-ink">{row.path}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`font-mono text-[12px] ${
                          row.status === 'success'
                            ? 'text-[var(--success)]'
                            : 'text-[var(--danger)]'
                        }`}
                      >
                        {row.code}
                      </span>
                    </td>
                    <td className="font-mono-num px-3 py-3 text-[11px] text-ink-3">{row.ms}</td>
                    <td className="hidden px-4 py-3 text-right text-[11px] text-ink-3 sm:table-cell">
                      {row.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        <div className="flex flex-col gap-6">
          <SectionIntro
            title="Relay to your real endpoint with retries"
            body="Set a forwarding URL and Hookbay becomes the delivery layer. Each attempt is recorded with its status code, duration, and error, so a failed webhook is never a mystery."
          />
          <ul className="flex flex-col gap-3 text-[13.5px] text-ink-2">
            {[
              'Retries at 0s, 1.5s, and 5s before giving up.',
              'Signed with an X-Hookbay-Signature header on every attempt.',
              'Replays run separately, so you can test a target without touching production.',
            ].map((item) => (
              <li className="flex gap-2.5" key={item}>
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" />
                {item}
              </li>
            ))}
          </ul>
          <div>
            <Link className="btn btn-ghost" href="/docs#relay">
              Read the relay contract
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    description: 'For solo debugging and side projects.',
    features: [
      '4 endpoints',
      '300 requests per endpoint',
      'Live stream, replay, relay',
      'Signing secret per endpoint',
    ],
    cta: { label: 'Start free', href: '/signup' },
    featured: false,
  },
  {
    name: 'Pro',
    price: '$19',
    cadence: 'per month',
    description: 'For teams running webhooks in production.',
    features: [
      '25 endpoints',
      '5,000 requests per endpoint',
      'Longer retention window',
      'Priority relay queue',
      'Priority support',
    ],
    cta: { label: 'Upgrade in console', href: '/app' },
    featured: true,
  },
];

export function Pricing(): React.JSX.Element {
  return (
    <section className="border-b border-line" id="pricing">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-10 px-5 py-20">
        <SectionIntro
          body="Plans set real limits inside the app. Billing is not wired up in this preview — you can switch plans from the console to see the limits change."
          eyebrow="Pricing"
          title="Two plans, enforced by the product"
        />
        <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
          {PLANS.map((plan) => (
            <div
              className={`panel flex flex-col gap-6 p-6 ${plan.featured ? 'bg-surface-2' : ''}`}
              key={plan.name}
            >
              <div className="flex items-baseline justify-between">
                <h3 className="text-[15px] font-medium text-ink">{plan.name}</h3>
                {plan.featured && (
                  <span className="chip border-[var(--accent)]/35 text-[var(--accent)]">
                    recommended
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-tight text-ink">{plan.price}</span>
                <span className="text-[13px] text-ink-3">{plan.cadence}</span>
              </div>
              <p className="text-[13.5px] leading-relaxed text-ink-2">{plan.description}</p>
              <ul className="flex flex-col gap-2.5 text-[13.5px] text-ink-2">
                {plan.features.map((feature) => (
                  <li className="flex gap-2.5" key={feature}>
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Magnetic>
                <Link
                  className={`btn mt-auto w-full ${plan.featured ? 'btn-primary' : 'btn-ghost'}`}
                  href={plan.cta.href}
                >
                  {plan.cta.label}
                </Link>
              </Magnetic>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQ = [
  {
    q: 'How does Hookbay receive my webhooks?',
    a: 'Each endpoint gets a public URL under /in/. Point any provider at it. Hookbay accepts every method, stores the request, and streams it to your browser.',
  },
  {
    q: 'Do I need to expose my local machine?',
    a: 'No. Hookbay holds the inbox on the server. Replay or relay to localhost is a separate step you run when you are ready.',
  },
  {
    q: 'What happens when my endpoint is full?',
    a: 'Free endpoints keep the newest 300 requests and drop the oldest automatically. Pro keeps 5,000. You can clear history at any time.',
  },
  {
    q: 'Is the relay signed?',
    a: 'Yes. Every forwarded request carries X-Hookbay-Event-Id, X-Hookbay-Delivery, and an X-Hookbay-Signature header derived from the event and the endpoint secret.',
  },
];

export function Faq(): React.JSX.Element {
  return (
    <section className="border-b border-line">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-[2rem]">
          Questions, answered plainly
        </h2>
        <div className="flex flex-col">
          {FAQ.map((item) => (
            <details className="group border-t border-line py-5" key={item.q}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium text-ink">
                {item.q}
                <span className="text-ink-3 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="max-w-[70ch] pt-3 text-[13.5px] leading-relaxed text-ink-2">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta(): React.JSX.Element {
  const origin = useOrigin();
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="grid-layer pointer-events-none absolute inset-0" />
      <div className="relative mx-auto flex max-w-[1240px] flex-col items-start gap-6 px-5 py-20">
        <h2 className="max-w-[20ch] text-3xl font-semibold tracking-tight text-ink sm:text-[2.5rem]">
          Give your next webhook somewhere to land.
        </h2>
        <p className="max-w-[52ch] text-[14px] leading-relaxed text-ink-2">
          Create an endpoint in seconds. Point curl at {origin}/in/demo to watch it work before you
          sign up.
        </p>
        <div className="flex flex-wrap gap-3">
          <Magnetic>
            <Link className="btn btn-primary" href="/signup">
              Start free
            </Link>
          </Magnetic>
          <Link className="btn btn-ghost" href="/demo">
            Watch the sandbox
          </Link>
        </div>
      </div>
    </section>
  );
}
