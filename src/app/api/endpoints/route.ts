import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fail, ok, parseJson } from '@/lib/api';
import { getSessionUser } from '@/lib/auth';
import { endpointSlug } from '@/lib/crypto';
import { PLAN_LIMITS, endpointsRepo } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60),
  forwardUrl: z
    .union([z.string().trim().url('Enter a valid URL'), z.literal('')])
    .optional()
    .transform((value) => (value === '' || value === undefined ? null : value)),
  forwardEnabled: z.boolean().optional().default(false),
});

export async function GET(): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return fail('Not authenticated', 'ERR_UNAUTHENTICATED', 401);
  return ok({ endpoints: endpointsRepo.listByWorkspace(session.workspace.id) });
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return fail('Not authenticated', 'ERR_UNAUTHENTICATED', 401);

  const parsed = await parseJson(request, createSchema);
  if (!parsed.ok) return parsed.response;

  const plan = session.workspace.plan;
  const used = endpointsRepo.countForWorkspace(session.workspace.id);
  if (used >= PLAN_LIMITS[plan].endpoints) {
    return fail(
      `Your ${plan} plan allows ${PLAN_LIMITS[plan].endpoints} endpoints. Delete one or upgrade to add more.`,
      'ERR_PLAN_LIMIT',
      402,
    );
  }

  let slug = endpointSlug(parsed.data.name);
  while (endpointsRepo.findBySlug(slug)) slug = endpointSlug(parsed.data.name);

  const endpoint = endpointsRepo.create({
    workspaceId: session.workspace.id,
    name: parsed.data.name,
    slug,
    forwardUrl: parsed.data.forwardUrl,
    forwardEnabled: parsed.data.forwardEnabled,
  });

  return ok({ endpoint: { ...endpoint, eventCount: 0, lastEventAt: null } }, { status: 201 });
}
