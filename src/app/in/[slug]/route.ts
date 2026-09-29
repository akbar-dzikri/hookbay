import { NextResponse, after } from 'next/server';
import { endpointsRepo } from '@/lib/db';
import { MAX_BODY_BYTES, checkRateLimit, recordEvent, relayEvent } from '@/lib/ingest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ slug: string }>;
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

function clientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? null;
  return request.headers.get('x-real-ip') ?? request.headers.get('cf-connecting-ip');
}

function endpointPage(request: Request, slug: string): string {
  const url = new URL(`/demo`, request.url).toString();
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Ingest endpoint /in/${slug}</title>
<style>
  :root { color-scheme: dark; }
  body { margin:0; min-height:100dvh; display:grid; place-items:center; background:#0a0a0a; color:#f0f0f0;
    font-family: ui-monospace, "SF Mono", Menlo, monospace; padding:24px; }
  main { max-width:640px; width:100%; border:1px solid #2a2a2a; border-radius:14px; background:#111; padding:28px; }
  .tag { display:inline-block; font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:#c6f24e; margin-bottom:14px; }
  h1 { font-size:20px; margin:0 0 8px; font-weight:600; }
  p { color:#8a8a8a; font-size:13px; line-height:1.6; margin:0 0 18px; }
  code { background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); padding:2px 6px; border-radius:6px; font-size:12px; }
  pre { background:#0d0d0d; border:1px solid #232323; border-radius:10px; padding:14px; overflow:auto; font-size:12px; color:#dcdcdc; }
  a { color:#c6f24e; }
</style></head>
<body><main>
  <span class="tag">endpoint live</span>
  <h1>/in/${slug}</h1>
  <p>This URL accepts any HTTP method. Every request is captured and streamed to the inspector in real time.</p>
  <pre>curl -X POST ${new URL(request.url).origin}/in/${slug} \\
  -H "content-type: application/json" \\
  -d '{"hello":"world"}'</pre>
  <p>Watch it arrive in the <a href="${url}">live demo inspector</a>.</p>
</main></body></html>`;
}

async function ingest(request: Request, ctx: Ctx, method: string): Promise<Response> {
  const { slug } = await ctx.params;
  const endpoint = endpointsRepo.findBySlug(slug);
  if (!endpoint) {
    return NextResponse.json(
      { status: 'error', message: 'Unknown ingest URL', code: 'ERR_ENDPOINT_NOT_FOUND' },
      { status: 404, headers: CORS_HEADERS },
    );
  }

  const accept = request.headers.get('accept') ?? '';
  if (method === 'GET' && accept.includes('text/html')) {
    return new Response(endpointPage(request, endpoint.slug), {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }

  const limit = checkRateLimit(endpoint.id);
  if (!limit.allowed) {
    return NextResponse.json(
      { status: 'error', message: 'Rate limit exceeded', code: 'ERR_RATE_LIMITED' },
      { status: 429, headers: { ...CORS_HEADERS, 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  const url = new URL(request.url);
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  let rawBody = '';
  if (method !== 'GET' && method !== 'HEAD') {
    rawBody = await request.text();
  }
  const truncated = rawBody.length > MAX_BODY_BYTES;
  const body = truncated ? rawBody.slice(0, MAX_BODY_BYTES) : rawBody;

  const event = recordEvent(endpoint, {
    method,
    path: url.pathname,
    query,
    headers,
    body,
    bodySize: Buffer.byteLength(rawBody, 'utf8'),
    contentType: request.headers.get('content-type'),
    ip: clientIp(request),
  });

  after(() => relayEvent(event, endpoint));

  const payload = {
    status: 'success',
    data: {
      id: event.id,
      endpoint: endpoint.slug,
      receivedAt: event.receivedAt,
      truncated,
      relayed: endpoint.forwardEnabled,
    },
  };

  if (method === 'HEAD') {
    return new Response(null, { status: 202, headers: CORS_HEADERS });
  }
  return NextResponse.json(payload, { status: 202, headers: CORS_HEADERS });
}

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: Request, ctx: Ctx): Promise<Response> {
  return ingest(request, ctx, 'GET');
}

export async function POST(request: Request, ctx: Ctx): Promise<Response> {
  return ingest(request, ctx, 'POST');
}

export async function PUT(request: Request, ctx: Ctx): Promise<Response> {
  return ingest(request, ctx, 'PUT');
}

export async function PATCH(request: Request, ctx: Ctx): Promise<Response> {
  return ingest(request, ctx, 'PATCH');
}

export async function DELETE(request: Request, ctx: Ctx): Promise<Response> {
  return ingest(request, ctx, 'DELETE');
}

export async function HEAD(request: Request, ctx: Ctx): Promise<Response> {
  return ingest(request, ctx, 'HEAD');
}
