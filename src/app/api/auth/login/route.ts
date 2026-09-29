import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fail, ok, parseJson } from '@/lib/api';
import { startSession } from '@/lib/auth';
import { verifyPassword } from '@/lib/crypto';
import { users, workspaces } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: Request): Promise<NextResponse> {
  const parsed = await parseJson(request, schema);
  if (!parsed.ok) return parsed.response;

  const user = users.findByEmail(parsed.data.email);
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return fail('Invalid email or password', 'ERR_INVALID_CREDENTIALS', 401);
  }

  const workspace = workspaces.findByOwner(user.id);
  if (!workspace) return fail('Workspace missing for this account', 'ERR_WORKSPACE_MISSING', 500);

  await startSession(user.id, request.headers.get('user-agent'));
  return ok({
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
    workspace,
  });
}
