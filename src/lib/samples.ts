import type { IngestPayload } from './ingest';

export interface Sample {
  label: string;
  source: string;
  payload: IngestPayload;
}

function rand(hex: number): string {
  let out = '';
  for (let i = 0; i < hex; i += 1) out += Math.floor(Math.random() * 16).toString(16);
  return out;
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

function jsonHeaders(source: string): Record<string, string> {
  return {
    'content-type': 'application/json',
    'user-agent': `${source}-webhooks/1.0`,
    accept: '*/*',
    'accept-encoding': 'gzip, deflate',
  };
}

export function buildSamples(): Sample[] {
  const now = Math.floor(Date.now() / 1000);
  return [
    {
      label: 'Stripe · payment_intent.succeeded',
      source: 'Stripe',
      payload: {
        method: 'POST',
        path: '/in/demo',
        query: {},
        headers: {
          ...jsonHeaders('Stripe'),
          'stripe-signature': `t=${now},v1=${rand(64)}`,
        },
        body: JSON.stringify(
          {
            id: `evt_${rand(24)}`,
            object: 'event',
            type: 'payment_intent.succeeded',
            created: now,
            data: {
              object: {
                id: `pi_${rand(24)}`,
                object: 'payment_intent',
                amount: pick([1200, 4900, 15000, 2900]),
                currency: 'usd',
                status: 'succeeded',
                customer: `cus_${rand(14)}`,
              },
            },
          },
          null,
          2,
        ),
        bodySize: 0,
        contentType: 'application/json',
        ip: '54.187.174.169',
      },
    },
    {
      label: 'GitHub · push',
      source: 'GitHub',
      payload: {
        method: 'POST',
        path: '/in/demo',
        query: {},
        headers: {
          ...jsonHeaders('GitHub'),
          'x-github-event': 'push',
          'x-github-delivery': rand(36),
          'x-hub-signature-256': `sha256=${rand(64)}`,
        },
        body: JSON.stringify(
          {
            ref: 'refs/heads/main',
            repository: { full_name: 'acme/checkout-service', default_branch: 'main' },
            pusher: { name: pick(['ada', 'grace', 'linus']), email: 'dev@acme.test' },
            commits: [
              {
                id: rand(40),
                message: pick([
                  'fix: retry on 429',
                  'feat: add idempotency key',
                  'chore: bump deps',
                ]),
                author: { name: 'ada' },
              },
            ],
          },
          null,
          2,
        ),
        bodySize: 0,
        contentType: 'application/json',
        ip: '140.82.112.3',
      },
    },
    {
      label: 'Shopify · orders/create',
      source: 'Shopify',
      payload: {
        method: 'POST',
        path: '/in/demo',
        query: { shop: 'acme.myshopify.com' },
        headers: {
          ...jsonHeaders('Shopify'),
          'x-shopify-topic': 'orders/create',
          'x-shopify-hmac-sha256': rand(44),
        },
        body: JSON.stringify(
          {
            id: 8_201_983_747,
            email: 'customer@example.com',
            total_price: pick(['39.00', '128.50', '74.25']),
            currency: 'USD',
            line_items: [
              { title: 'Everyday Tee', quantity: 1, price: '39.00' },
              { title: 'Canvas Cap', quantity: 2, price: '17.75' },
            ],
          },
          null,
          2,
        ),
        bodySize: 0,
        contentType: 'application/json',
        ip: '23.227.38.32',
      },
    },
    {
      label: 'Twilio · SMS status',
      source: 'Twilio',
      payload: {
        method: 'POST',
        path: '/in/demo',
        query: {},
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'user-agent': 'TwilioProxy/1.1',
        },
        body: `MessageSid=SM${rand(30)}&MessageStatus=${pick(['delivered', 'sent', 'undelivered'])}&To=%2B15551234567&From=%2B15557654321&NumSegments=1`,
        bodySize: 0,
        contentType: 'application/x-www-form-urlencoded',
        ip: '54.172.60.1',
      },
    },
    {
      label: 'Generic · deploy hook',
      source: 'Deploy',
      payload: {
        method: 'POST',
        path: '/in/demo',
        query: { env: 'production' },
        headers: {
          ...jsonHeaders('Deploy'),
          'x-deploy-token': rand(32),
        },
        body: JSON.stringify(
          {
            event: 'deploy.finished',
            environment: 'production',
            service: 'checkout-api',
            commit: rand(7),
            duration_ms: pick([42_100, 18_400, 96_800]),
            status: 'success',
          },
          null,
          2,
        ),
        bodySize: 0,
        contentType: 'application/json',
        ip: '34.120.54.9',
      },
    },
  ];
}

export function randomSample(): Sample {
  return pick(buildSamples());
}
