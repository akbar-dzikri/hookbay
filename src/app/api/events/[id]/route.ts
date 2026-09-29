import { NextResponse } from 'next/server';
import { fail, ok } from '@/lib/api';
import { getSessionUser } from '@/lib/auth';
import { deliveriesRepo, endpointsRepo, eventsRepo } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, ctx: Ctx): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return fail('Not authenticated', 'ERR_UNAUTHENTICATED', 401);
  const { id } = await ctx.params;
  const event = eventsRepo.findById(id);
  if (!event) return fail('Event not found', 'ERR_EVENT_NOT_FOUND', 404);
  const endpoint = endpointsRepo.findById(event.endpointId);
  if (!endpoint || endpoint.workspaceId !== session.workspace.id) {
    return fail('Event not found', 'ERR_EVENT_NOT_FOUND', 404);
  }
  return ok({ event, endpoint, deliveries: deliveriesRepo.listByEvent(event.id) });
}

export async function DELETE(_request: Request, ctx: Ctx): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return fail('Not authenticated', 'ERR_UNAUTHENTICATED', 401);
  const { id } = await ctx.params;
  const event = eventsRepo.findById(id);
  if (!event) return fail('Event not found', 'ERR_EVENT_NOT_FOUND', 404);
  const endpoint = endpointsRepo.findById(event.endpointId);
  if (!endpoint || endpoint.workspaceId !== session.workspace.id) {
    return fail('Event not found', 'ERR_EVENT_NOT_FOUND', 404);
  }
  eventsRepo.deleteById(id);
  return ok({ deleted: true });
}
