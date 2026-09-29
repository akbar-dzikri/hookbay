import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fail, ok, parseJson } from '@/lib/api';
import { getSessionUser } from '@/lib/auth';
import { workspaces } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({ plan: z.enum(['free', 'pro']) });

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getSessionUser();
  if (!session) return fail('Not authenticated', 'ERR_UNAUTHENTICATED', 401);

  const parsed = await parseJson(request, schema);
  if (!parsed.ok) return parsed.response;

  workspaces.setPlan(session.workspace.id, parsed.data.plan);
  return ok({ workspace: workspaces.findById(session.workspace.id) });
}
