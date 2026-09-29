import { NextResponse } from 'next/server';
import { fail, ok } from '@/lib/api';
import { DEMO_ENDPOINT_SLUG, endpointsRepo, eventsRepo } from '@/lib/db';
import { ensureDemoSeeded, ensureSimulator } from '@/lib/simulator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  ensureSimulator();
  ensureDemoSeeded();
  const demo = endpointsRepo.findBySlug(DEMO_ENDPOINT_SLUG);
  if (!demo) return fail('Sandbox endpoint unavailable', 'ERR_DEMO_MISSING', 503);
  return ok({
    endpoint: { id: demo.id, slug: demo.slug, name: demo.name },
    events: eventsRepo.listByEndpoint(demo.id, 30),
  });
}
