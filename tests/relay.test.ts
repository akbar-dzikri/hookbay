import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const tempDir = mkdtempSync(path.join(os.tmpdir(), 'hookbay-relay-'));
process.env.HOOKBAY_DB = path.join(tempDir, 'relay.db');

const { db, users, workspaces, endpointsRepo, eventsRepo } = await import('../src/lib/db');
const { runAutoDelivery, runReplay } = await import('../src/lib/relay');

const flakyHits = new Map<string, number>();
let receivedSignature = '';
let base = '';
let server: Server;

function handle(request: IncomingMessage, response: ServerResponse): void {
  const url = request.url ?? '/';
  receivedSignature = request.headers['x-hookbay-signature']?.toString() ?? '';
  if (url === '/ok') {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end('{"received":true}');
    return;
  }
  if (url === '/fail') {
    response.writeHead(500);
    response.end('boom');
    return;
  }
  const hits = (flakyHits.get(url) ?? 0) + 1;
  flakyHits.set(url, hits);
  if (hits < 2) {
    response.writeHead(500);
    response.end('first attempt fails');
    return;
  }
  response.writeHead(200);
  response.end('recovered');
}

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = createServer(handle);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      base = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

afterAll(() => {
  server.close();
  db.close();
  rmSync(tempDir, { recursive: true, force: true });
});

function makeEvent(): string {
  const user = users.create({
    email: `relay-${Math.random().toString(36).slice(2, 8)}@test.dev`,
    name: 'Relay',
    passwordHash: 'scrypt:x:y',
  });
  const workspace = workspaces.create({
    name: 'Relay',
    slug: `relay-${Math.random().toString(36).slice(2, 8)}`,
    ownerId: user.id,
  });
  const endpoint = endpointsRepo.create({
    workspaceId: workspace.id,
    name: 'Target',
    slug: `target-${Math.random().toString(36).slice(2, 8)}`,
    forwardUrl: null,
    forwardEnabled: true,
  });
  return eventsRepo.create({
    endpointId: endpoint.id,
    method: 'POST',
    path: '/in/target',
    query: {},
    headers: { 'content-type': 'application/json', host: 'should-be-stripped' },
    body: '{"event":"test"}',
    bodySize: 15,
    contentType: 'application/json',
    ip: '127.0.0.1',
  }).id;
}

describe('relay delivery', () => {
  it('delivers successfully with signed headers', async () => {
    const eventId = makeEvent();
    const event = eventsRepo.findById(eventId);
    const deliveries = await runAutoDelivery(event!, `${base}/ok`, 'whsec_test');
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0]?.status).toBe('success');
    expect(deliveries[0]?.statusCode).toBe(200);
    expect(receivedSignature.startsWith('sha256=')).toBe(true);
  });

  it('retries a failing target and succeeds on the second attempt', async () => {
    const eventId = makeEvent();
    const event = eventsRepo.findById(eventId);
    const deliveries = await runAutoDelivery(event!, `${base}/flaky-${Date.now()}`, 'whsec_test');
    expect(deliveries).toHaveLength(2);
    expect(deliveries[0]?.status).toBe('failed');
    expect(deliveries[1]?.status).toBe('success');
    expect(deliveries[1]?.attempt).toBe(2);
  });

  it('records a failure when the target never recovers', async () => {
    const eventId = makeEvent();
    const event = eventsRepo.findById(eventId);
    const deliveries = await runAutoDelivery(event!, `${base}/fail`, 'whsec_test');
    expect(deliveries).toHaveLength(3);
    expect(deliveries.every((delivery) => delivery.status === 'failed')).toBe(true);
    expect(deliveries[0]?.error).toContain('500');
  });

  it('blocks metadata endpoints', async () => {
    const eventId = makeEvent();
    const event = eventsRepo.findById(eventId);
    const deliveries = await runAutoDelivery(
      event!,
      'http://169.254.169.254/latest/meta-data/',
      'whsec_test',
    );
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0]?.status).toBe('failed');
    expect(deliveries[0]?.error).toBe('target host is not allowed');
  });

  it('replays as a single delivery tagged with the replay trigger', async () => {
    const eventId = makeEvent();
    const event = eventsRepo.findById(eventId);
    const delivery = await runReplay(event!, `${base}/ok`, 'whsec_test');
    expect(delivery.trigger).toBe('replay');
    expect(delivery.status).toBe('success');
    expect(delivery.attempt).toBe(1);
  });
});
