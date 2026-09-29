import { PLAN_LIMITS, eventsRepo, workspaces } from './db';
import { publish } from './bus';
import { runAutoDelivery } from './relay';
import type { Endpoint, EventRecord } from './types';

export const MAX_BODY_BYTES = 128 * 1024;
export const MAX_HEADER_BYTES = 32 * 1024;
const RATE_LIMIT_PER_MINUTE = 300;
const RATE_WINDOW_MS = 60_000;

interface Bucket {
  count: number;
  resetAt: number;
}

declare global {
  var __hookbayRate: Map<string, Bucket> | undefined;
}

const buckets: Map<string, Bucket> =
  globalThis.__hookbayRate ?? (globalThis.__hookbayRate = new Map());

export function checkRateLimit(endpointId: string): {
  allowed: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const bucket = buckets.get(endpointId);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(endpointId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  bucket.count += 1;
  if (bucket.count > RATE_LIMIT_PER_MINUTE) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

export interface IngestPayload {
  method: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  body: string;
  bodySize: number;
  contentType: string | null;
  ip: string | null;
}

export function recordEvent(endpoint: Endpoint, payload: IngestPayload): EventRecord {
  const event = eventsRepo.create({ endpointId: endpoint.id, ...payload });
  publish(endpoint.id, event);

  const plan = workspaces.findById(endpoint.workspaceId)?.plan ?? 'free';
  eventsRepo.trimEndpoint(endpoint.id, PLAN_LIMITS[plan].eventsPerEndpoint);
  return event;
}

export function endpointSecret(endpoint: Endpoint): string {
  return endpoint.isDemo ? 'sandbox' : endpoint.secret;
}

export async function relayEvent(event: EventRecord, endpoint: Endpoint): Promise<void> {
  if (!endpoint.forwardEnabled || !endpoint.forwardUrl) return;
  await runAutoDelivery(event, endpoint.forwardUrl, endpointSecret(endpoint));
}
