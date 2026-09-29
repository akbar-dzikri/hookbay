import { fail } from '@/lib/api';
import { DEMO_ENDPOINT_SLUG, endpointsRepo, eventsRepo } from '@/lib/db';
import { ensureDemoSeeded, ensureSimulator } from '@/lib/simulator';
import { createEventStream } from '@/lib/sse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  ensureSimulator();
  ensureDemoSeeded();
  const demo = endpointsRepo.findBySlug(DEMO_ENDPOINT_SLUG);
  if (!demo) return fail('Sandbox endpoint unavailable', 'ERR_DEMO_MISSING', 503);
  const initial = eventsRepo.listByEndpoint(demo.id, 30).reverse();
  return createEventStream({ endpointId: demo.id, initial, signal: request.signal });
}
