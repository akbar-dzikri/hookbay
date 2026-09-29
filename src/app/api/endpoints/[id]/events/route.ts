import { NextResponse } from 'next/server';
import { fail, ok } from '@/lib/api';
import { getSessionUser } from '@/lib/auth';
import { endpointsRepo, eventsRepo } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

async function ownedEndpointId(ctx: Ctx): Promise<string | null> {
  const session = await getSessionUser();
  if (!session) return null;
  const { id } = await ctx.params;
  const endpoint = endpointsRepo.findById(id);
  if (!endpoint || endpoint.workspaceId !== session.workspace.id) return null;
  return id;
}

export async function GET(request: Request, ctx: Ctx): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return fail('Not authenticated', 'ERR_UNAUTHENTICATED', 401);
  const endpointId = await ownedEndpointId(ctx);
  if (!endpointId) return fail('Endpoint not found', 'ERR_ENDPOINT_NOT_FOUND', 404);

  const requested = Number(new URL(request.url).searchParams.get('limit') ?? '100');
  const limit = Number.isFinite(requested)
    ? Math.min(Math.max(Math.trunc(requested), 1), 500)
    : 100;

  return ok({ events: eventsRepo.listByEndpoint(endpointId, limit) });
}

export async function DELETE(_request: Request, ctx: Ctx): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return fail('Not authenticated', 'ERR_UNAUTHENTICATED', 401);
  const endpointId = await ownedEndpointId(ctx);
  if (!endpointId) return fail('Endpoint not found', 'ERR_ENDPOINT_NOT_FOUND', 404);
  eventsRepo.clearEndpoint(endpointId);
  return ok({ cleared: true });
}
