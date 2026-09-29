import { randomBytes } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { hashToken, sessions, workspaces } from './db';
import type { SessionUser } from './types';

export const SESSION_COOKIE = 'hookbay_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

async function isSecureRequest(): Promise<boolean> {
  const h = await headers();
  return h.get('x-forwarded-proto') === 'https';
}

export async function startSession(userId: string, userAgent: string | null): Promise<string> {
  const token = randomBytes(32).toString('hex');
  sessions.create({
    userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    userAgent,
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: await isSecureRequest(),
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  });
  return token;
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) sessions.destroy(hashToken(token));
  jar.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const user = sessions.findUserByTokenHash(hashToken(token));
  if (!user) return null;
  const workspace = workspaces.findByOwner(user.id);
  if (!workspace) return null;
  return { user, workspace };
}
