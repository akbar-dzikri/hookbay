import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fail, ok, parseJson } from '@/lib/api';
import { startSession } from '@/lib/auth';
import { hashPassword, slugify } from '@/lib/crypto';
import { endpointsRepo, users, workspaces } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
});

export async function POST(request: Request): Promise<NextResponse> {
  const parsed = await parseJson(request, schema);
  if (!parsed.ok) return parsed.response;

  if (users.findByEmail(parsed.data.email)) {
    return fail('An account with that email already exists', 'ERR_EMAIL_TAKEN', 409, [
      { field: 'email', message: 'Email already registered' },
    ]);
  }

  const user = users.create({
    email: parsed.data.email,
    name: parsed.data.name,
    passwordHash: hashPassword(parsed.data.password),
  });

  const workspace = workspaces.create({
    name: `${parsed.data.name.split(' ')[0]}'s workspace`,
    slug: `${slugify(parsed.data.email.split('@')[0] ?? 'workspace')}-${user.id.slice(0, 6)}`,
    ownerId: user.id,
  });

  await startSession(user.id, request.headers.get('user-agent'));
  endpointsRepo.create({
    workspaceId: workspace.id,
    name: 'My first endpoint',
    slug: `my-first-endpoint-${user.id.slice(0, 6)}`,
    forwardUrl: null,
    forwardEnabled: false,
  });
  return ok({ user, workspace }, { status: 201 });
}
