import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

const tempDir = mkdtempSync(path.join(os.tmpdir(), 'hookbay-db-'));
process.env.HOOKBAY_DB = path.join(tempDir, 'test.db');

const { db, users, workspaces, sessions, endpointsRepo, eventsRepo, deliveriesRepo, hashToken } =
  await import('../src/lib/db');

afterAll(() => {
  db.close();
  rmSync(tempDir, { recursive: true, force: true });
});

function makeEndpoint(workspaceId: string, name: string): string {
  return endpointsRepo.create({
    workspaceId,
    name,
    slug: `test-${Math.random().toString(36).slice(2, 8)}`,
    forwardUrl: null,
    forwardEnabled: false,
  }).id;
}

describe('demo seed', () => {
  it('creates a public sandbox endpoint', () => {
    const demo = endpointsRepo.findBySlug('demo');
    expect(demo).not.toBeNull();
    expect(demo?.isDemo).toBe(true);
  });

  it('refuses to delete the demo endpoint', () => {
    endpointsRepo.delete('demo-endpoint');
    expect(endpointsRepo.findBySlug('demo')).not.toBeNull();
  });
});

describe('accounts', () => {
  it('creates users, workspaces and verifies sessions by token hash', () => {
    const user = users.create({
      email: 'owner@test.dev',
      name: 'Owner',
      passwordHash: 'scrypt:x:y',
    });
    const workspace = workspaces.create({
      name: 'Owner workspace',
      slug: 'owner',
      ownerId: user.id,
    });

    expect(users.findByEmail('OWNER@test.dev')?.id).toBe(user.id);
    expect(workspaces.findByOwner(user.id)?.id).toBe(workspace.id);

    const tokenHash = hashToken('session-token');
    sessions.create({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      userAgent: 'vitest',
    });
    expect(sessions.findUserByTokenHash(tokenHash)?.email).toBe('owner@test.dev');

    sessions.destroy(tokenHash);
    expect(sessions.findUserByTokenHash(tokenHash)).toBeNull();
  });

  it('ignores expired sessions', () => {
    const user = users.create({
      email: 'expired@test.dev',
      name: 'Expired',
      passwordHash: 'scrypt:x:y',
    });
    const tokenHash = hashToken('expired-token');
    sessions.create({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() - 1_000).toISOString(),
      userAgent: null,
    });
    expect(sessions.findUserByTokenHash(tokenHash)).toBeNull();
  });
});

describe('endpoints', () => {
  it('lists with stats, updates relay config, rotates secrets', () => {
    const user = users.create({ email: 'ep@test.dev', name: 'EP', passwordHash: 'scrypt:x:y' });
    const workspace = workspaces.create({ name: 'EP', slug: 'ep-ws', ownerId: user.id });
    const endpointId = makeEndpoint(workspace.id, 'Stripe');
    const before = endpointsRepo.findById(endpointId);

    endpointsRepo.update(endpointId, {
      name: 'Stripe live',
      forwardUrl: 'https://example.com/hook',
      forwardEnabled: true,
    });
    const after = endpointsRepo.findById(endpointId);
    expect(after?.name).toBe('Stripe live');
    expect(after?.forwardEnabled).toBe(true);
    expect(after?.forwardUrl).toBe('https://example.com/hook');

    const rotated = endpointsRepo.rotateSecret(endpointId);
    expect(rotated).not.toBe(before?.secret);
    expect(endpointsRepo.findById(endpointId)?.secret).toBe(rotated);

    const list = endpointsRepo.listByWorkspace(workspace.id);
    expect(list).toHaveLength(1);
    expect(list[0]?.eventCount).toBe(0);

    endpointsRepo.delete(endpointId);
    expect(endpointsRepo.findById(endpointId)).toBeNull();
  });
});

describe('events', () => {
  it('captures, orders, and trims by retention', () => {
    const user = users.create({ email: 'ev@test.dev', name: 'EV', passwordHash: 'scrypt:x:y' });
    const workspace = workspaces.create({ name: 'EV', slug: 'ev-ws', ownerId: user.id });
    const endpointId = makeEndpoint(workspace.id, 'Events');

    for (let index = 0; index < 5; index += 1) {
      eventsRepo.create({
        endpointId,
        method: 'POST',
        path: '/in/test',
        query: { index: String(index) },
        headers: { 'content-type': 'application/json' },
        body: `{"index":${index}}`,
        bodySize: 12,
        contentType: 'application/json',
        ip: '127.0.0.1',
      });
    }
    expect(eventsRepo.countByEndpoint(endpointId)).toBe(5);

    eventsRepo.trimEndpoint(endpointId, 2);
    expect(eventsRepo.countByEndpoint(endpointId)).toBe(2);

    const latest = eventsRepo.listByEndpoint(endpointId, 10);
    expect(latest[0]?.query).toEqual({ index: '4' });
    expect(latest[0]?.body).toBe('{"index":4}');

    eventsRepo.clearEndpoint(endpointId);
    expect(eventsRepo.countByEndpoint(endpointId)).toBe(0);
  });
});

describe('deliveries', () => {
  it('records attempts against an event', () => {
    const user = users.create({ email: 'dl@test.dev', name: 'DL', passwordHash: 'scrypt:x:y' });
    const workspace = workspaces.create({ name: 'DL', slug: 'dl-ws', ownerId: user.id });
    const endpointId = makeEndpoint(workspace.id, 'Deliveries');
    const event = eventsRepo.create({
      endpointId,
      method: 'POST',
      path: '/in/test',
      query: {},
      headers: {},
      body: '',
      bodySize: 0,
      contentType: null,
      ip: null,
    });

    deliveriesRepo.create({
      eventId: event.id,
      endpointId,
      targetUrl: 'https://example.com/hook',
      trigger: 'auto',
      attempt: 1,
      status: 'failed',
      statusCode: 500,
      durationMs: 42,
      error: 'target responded 500',
    });
    deliveriesRepo.create({
      eventId: event.id,
      endpointId,
      targetUrl: 'https://example.com/hook',
      trigger: 'auto',
      attempt: 2,
      status: 'success',
      statusCode: 200,
      durationMs: 21,
      error: null,
    });

    const list = deliveriesRepo.listByEvent(event.id);
    expect(list).toHaveLength(2);
    expect(list[0]?.status).toBe('success');
    expect(list[1]?.attempt).toBe(1);
  });
});
