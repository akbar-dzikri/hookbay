import { subscriberCount } from './bus';
import { DEMO_ENDPOINT_SLUG, endpointsRepo, eventsRepo } from './db';
import { recordEvent } from './ingest';
import { randomSample } from './samples';
import type { EventRecord } from './types';

declare global {
  var __hookbaySimulator: ReturnType<typeof setInterval> | undefined;
}

const SIMULATOR_INTERVAL_MS = 9_000;
const SEED_COUNT = 5;

function demoEndpointId(): string | null {
  return endpointsRepo.findBySlug(DEMO_ENDPOINT_SLUG)?.id ?? null;
}

export function emitSample(): EventRecord | null {
  const demo = endpointsRepo.findBySlug(DEMO_ENDPOINT_SLUG);
  if (!demo) return null;
  const sample = randomSample();
  return recordEvent(demo, {
    ...sample.payload,
    bodySize: Buffer.byteLength(sample.payload.body, 'utf8'),
  });
}

export function ensureDemoSeeded(): void {
  const demo = endpointsRepo.findBySlug(DEMO_ENDPOINT_SLUG);
  if (!demo) return;
  if (eventsRepo.countByEndpoint(demo.id) > 0) return;
  for (let i = 0; i < SEED_COUNT; i += 1) emitSample();
}

export function ensureSimulator(): void {
  if (globalThis.__hookbaySimulator) return;
  const timer = setInterval(() => {
    try {
      const endpointId = demoEndpointId();
      if (!endpointId) return;
      if (subscriberCount(endpointId) === 0) return;
      emitSample();
    } catch {
      // never let the simulator crash the server
    }
  }, SIMULATOR_INTERVAL_MS);
  timer.unref();
  globalThis.__hookbaySimulator = timer;
}
