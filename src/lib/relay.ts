import { deliveriesRepo } from './db';
import type { Delivery, DeliveryTrigger, EventRecord } from './types';

const AUTO_BACKOFF_MS = [0, 1_500, 5_000];
const REQUEST_TIMEOUT_MS = 10_000;

const HOP_BY_HOP = new Set([
  'host',
  'content-length',
  'connection',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
  'accept-encoding',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'expect',
]);

const BLOCKED_HOSTS = new Set(['169.254.169.254', 'metadata.google.internal']);

function buildForwardHeaders(event: EventRecord, secret: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(event.headers)) {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower)) continue;
    out[key] = value;
  }
  out['X-Hookbay-Event-Id'] = event.id;
  out['X-Hookbay-Delivery'] = 'relay';
  out['X-Hookbay-Signature'] = fnv1a(`${event.id}.${event.receivedAt}.${secret}`);
  return out;
}

function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `sha256=${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function isBlocked(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return 'unsupported protocol';
    }
    if (BLOCKED_HOSTS.has(parsed.hostname)) return 'target host is not allowed';
    return null;
  } catch {
    return 'invalid target url';
  }
}

async function attempt(
  event: EventRecord,
  targetUrl: string,
  secret: string,
  attemptNumber: number,
  trigger: DeliveryTrigger,
): Promise<Delivery> {
  const startedAt = Date.now();
  const canHaveBody = event.method !== 'GET' && event.method !== 'HEAD';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(targetUrl, {
      method: event.method,
      headers: buildForwardHeaders(event, secret),
      body: canHaveBody && event.body.length > 0 ? event.body : undefined,
      redirect: 'follow',
      signal: controller.signal,
    });
    const durationMs = Date.now() - startedAt;
    return deliveriesRepo.create({
      eventId: event.id,
      endpointId: event.endpointId,
      targetUrl,
      trigger,
      attempt: attemptNumber,
      status: response.ok ? 'success' : 'failed',
      statusCode: response.status,
      durationMs,
      error: response.ok ? null : `target responded ${response.status}`,
    });
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const message =
      error instanceof Error
        ? error.name === 'AbortError'
          ? `timed out after ${REQUEST_TIMEOUT_MS}ms`
          : error.message
        : 'unknown delivery error';
    return deliveriesRepo.create({
      eventId: event.id,
      endpointId: event.endpointId,
      targetUrl,
      trigger,
      attempt: attemptNumber,
      status: 'failed',
      statusCode: null,
      durationMs,
      error: message,
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function runAutoDelivery(
  event: EventRecord,
  targetUrl: string,
  secret: string,
): Promise<Delivery[]> {
  const blocked = isBlocked(targetUrl);
  if (blocked) {
    return [
      deliveriesRepo.create({
        eventId: event.id,
        endpointId: event.endpointId,
        targetUrl,
        trigger: 'auto',
        attempt: 1,
        status: 'failed',
        statusCode: null,
        durationMs: 0,
        error: blocked,
      }),
    ];
  }

  const results: Delivery[] = [];
  for (let i = 0; i < AUTO_BACKOFF_MS.length; i += 1) {
    if (i > 0) await new Promise((resolve) => setTimeout(resolve, AUTO_BACKOFF_MS[i] ?? 0));
    const delivery = await attempt(event, targetUrl, secret, i + 1, 'auto');
    results.push(delivery);
    if (delivery.status === 'success') break;
  }
  return results;
}

export async function runReplay(
  event: EventRecord,
  targetUrl: string,
  secret: string,
): Promise<Delivery> {
  const blocked = isBlocked(targetUrl);
  if (blocked) {
    return deliveriesRepo.create({
      eventId: event.id,
      endpointId: event.endpointId,
      targetUrl,
      trigger: 'replay',
      attempt: 1,
      status: 'failed',
      statusCode: null,
      durationMs: 0,
      error: blocked,
    });
  }
  return attempt(event, targetUrl, secret, 1, 'replay');
}
