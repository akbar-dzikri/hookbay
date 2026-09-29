import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fail, ok, parseJson } from '@/lib/api';
import { getSessionUser } from '@/lib/auth';
import { endpointsRepo } from '@/lib/db';
import type { SessionUser } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
  params: Promise<{ id: string }>;
}

const patchSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  forwardUrl: z
    .union([z.string().trim().url('Enter a valid URL'), z.literal('')])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === '' ? null : value)),
  forwardEnabled: z.boolean().optional(),
  rotateSecret: z.boolean().optional(),
});

async function loadOwned(
  ctx: Ctx,
): Promise<{ session: SessionUser; endpointId: string } | { response: NextResponse }> {
  const session = await getSessionUser();
  if (!session) return { response: fail('Not authenticated', 'ERR_UNAUTHENTICATED', 401) };
  const { id } = await ctx.params;
  const endpoint = endpointsRepo.findById(id);
  if (!endpoint || endpoint.workspaceId !== session.workspace.id) {
    return { response: fail('Endpoint not found', 'ERR_ENDPOINT_NOT_FOUND', 404) };
  }
  return { session, endpointId: id };
}

export async function GET(_request: Request, ctx: Ctx): Promise<NextResponse> {
  const owned = await loadOwned(ctx);
  if ('response' in owned) return owned.response;
  const endpoint = endpointsRepo.findById(owned.endpointId);
  return ok({ endpoint });
}

export async function PATCH(request: Request, ctx: Ctx): Promise<NextResponse> {
  const owned = await loadOwned(ctx);
  if ('response' in owned) return owned.response;

  const parsed = await parseJson(request, patchSchema);
  if (!parsed.ok) return parsed.response;

  const current = endpointsRepo.findById(owned.endpointId);
  if (!current) return fail('Endpoint not found', 'ERR_ENDPOINT_NOT_FOUND', 404);
  if (current.isDemo)
    return fail('The sandbox endpoint is read-only', 'ERR_ENDPOINT_READONLY', 403);

  endpointsRepo.update(owned.endpointId, {
    name: parsed.data.name,
    forwardUrl: parsed.data.forwardUrl,
    forwardEnabled: parsed.data.forwardEnabled,
  });

  if (parsed.data.rotateSecret) endpointsRepo.rotateSecret(owned.endpointId);

  return ok({ endpoint: endpointsRepo.findById(owned.endpointId) });
}

export async function DELETE(_request: Request, ctx: Ctx): Promise<NextResponse> {
  const owned = await loadOwned(ctx);
  if ('response' in owned) return owned.response;
  const current = endpointsRepo.findById(owned.endpointId);
  if (!current) return fail('Endpoint not found', 'ERR_ENDPOINT_NOT_FOUND', 404);
  if (current.isDemo)
    return fail('The sandbox endpoint is read-only', 'ERR_ENDPOINT_READONLY', 403);
  endpointsRepo.delete(owned.endpointId);
  return ok({ deleted: true });
}
