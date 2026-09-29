import { fail } from '@/lib/api';
import { getSessionUser } from '@/lib/auth';
import { endpointsRepo, eventsRepo } from '@/lib/db';
import { createEventStream } from '@/lib/sse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, ctx: Ctx): Promise<Response> {
  const session = await getSessionUser();
  if (!session) return fail('Not authenticated', 'ERR_UNAUTHENTICATED', 401);
  const { id } = await ctx.params;
  const endpoint = endpointsRepo.findById(id);
  if (!endpoint || endpoint.workspaceId !== session.workspace.id) {
    return fail('Endpoint not found', 'ERR_ENDPOINT_NOT_FOUND', 404);
  }
  const initial = eventsRepo.listByEndpoint(id, 60).reverse();
  return createEventStream({ endpointId: id, initial, signal: request.signal });
}
