import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fail, ok, parseJson } from '@/lib/api';
import { DEMO_ENDPOINT_SLUG, endpointsRepo, eventsRepo } from '@/lib/db';
import { runReplay } from '@/lib/relay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({ eventId: z.string().min(1) });

export async function POST(request: Request): Promise<NextResponse> {
  const parsed = await parseJson(request, schema);
  if (!parsed.ok) return parsed.response;

  const demo = endpointsRepo.findBySlug(DEMO_ENDPOINT_SLUG);
  if (!demo) return fail('Sandbox endpoint unavailable', 'ERR_DEMO_MISSING', 503);

  const event = eventsRepo.findById(parsed.data.eventId);
  if (!event || event.endpointId !== demo.id) {
    return fail('Event not found in sandbox', 'ERR_EVENT_NOT_FOUND', 404);
  }

  const target = new URL('/api/echo', request.url).toString();
  const delivery = await runReplay(event, target, 'sandbox');
  return ok({ delivery, target });
}
