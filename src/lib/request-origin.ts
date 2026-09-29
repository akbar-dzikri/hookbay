import { headers } from 'next/headers';

export async function getRequestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host')?.split(',')[0]?.trim() ?? h.get('host');
  const proto = h.get('x-forwarded-proto')?.split(',')[0]?.trim() ?? 'http';
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4310';
}
