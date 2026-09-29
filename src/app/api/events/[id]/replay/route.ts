import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fail, ok, parseJson } from '@/lib/api';
import { getSessionUser } from '@/lib/auth';
import { deliveriesRepo, endpointsRepo, eventsRepo } from '@/lib/db';
import { endpointSecret } from '@/lib/ingest';
import { runReplay } from '@/lib/relay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

const schema = z.object({
  targetUrl: z.string().trim().url('Enter a valid URL').optional(),
});

export async function POST(request: Request, ctx: Ctx): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return fail('Not authenticated', 'ERR_UNAUTHENTICATED', 401);

  const { id } = await ctx.params;
  const event = eventsRepo.findById(id);
  if (!event) return fail('Event not found', 'ERR_EVENT_NOT_FOUND', 404);
  const endpoint = endpointsRepo.findById(event.endpointId);
  if (!endpoint || endpoint.workspaceId !== session.workspace.id) {
    return fail('Event not found', 'ERR_EVENT_NOT_FOUND', 404);
  }

  const parsed = await parseJson(request, schema);
  if (!parsed.ok) return parsed.response;

  const targetUrl = parsed.data.targetUrl ?? endpoint.forwardUrl;
  if (!targetUrl) {
    return fail(
      'No replay target. Set a forwarding URL on this endpoint or pass targetUrl.',
      'ERR_NO_TARGET',
      400,
    );
  }

  const delivery = await runReplay(event, targetUrl, endpointSecret(endpoint));
  return ok({ delivery, deliveries: deliveriesRepo.listByEvent(event.id) });
}
