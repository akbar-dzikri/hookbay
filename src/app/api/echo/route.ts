import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

async function echo(request: Request, method: string): Promise<NextResponse> {
  const url = new URL(request.url);
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  const body = method === 'GET' || method === 'HEAD' ? '' : await request.text();

  return NextResponse.json(
    {
      status: 'success',
      data: {
        message: 'Echo target received this delivery',
        method,
        path: url.pathname,
        query,
        headers,
        body: body.length > 0 ? body : null,
        receivedAt: new Date().toISOString(),
      },
    },
    { headers: CORS_HEADERS },
  );
}

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: Request): Promise<NextResponse> {
  return echo(request, 'GET');
}
export async function POST(request: Request): Promise<NextResponse> {
  return echo(request, 'POST');
}
export async function PUT(request: Request): Promise<NextResponse> {
  return echo(request, 'PUT');
}
export async function PATCH(request: Request): Promise<NextResponse> {
  return echo(request, 'PATCH');
}
export async function DELETE(request: Request): Promise<NextResponse> {
  return echo(request, 'DELETE');
}
export async function HEAD(request: Request): Promise<Response> {
  await echo(request, 'HEAD');
  return new Response(null, { status: 200, headers: CORS_HEADERS });
}
