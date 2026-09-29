import { DatabaseSync } from 'node:sqlite';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import type {
  Delivery,
  DeliveryStatus,
  DeliveryTrigger,
  Endpoint,
  EndpointWithStats,
  EventRecord,
  Plan,
  User,
  Workspace,
} from './types';

const DB_PATH = process.env.HOOKBAY_DB ?? path.join(process.cwd(), 'data', 'hookbay.db');

declare global {
  var __hookbayDb: DatabaseSync | undefined;
}

export const PLAN_LIMITS: Record<Plan, { endpoints: number; eventsPerEndpoint: number }> = {
  free: { endpoints: 4, eventsPerEndpoint: 300 },
  pro: { endpoints: 25, eventsPerEndpoint: 5000 },
};

export const DEMO_ENDPOINT_SLUG = 'demo';
const DEMO_USER_ID = 'demo-user';
const DEMO_WORKSPACE_ID = 'demo-workspace';
const DEMO_ENDPOINT_ID = 'demo-endpoint';

function migrate(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan TEXT NOT NULL DEFAULT 'free',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      user_agent TEXT
    );

    CREATE TABLE IF NOT EXISTS endpoints (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      secret TEXT NOT NULL,
      forward_url TEXT,
      forward_enabled INTEGER NOT NULL DEFAULT 0,
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      endpoint_id TEXT NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      query TEXT NOT NULL DEFAULT '{}',
      headers TEXT NOT NULL DEFAULT '{}',
      body TEXT NOT NULL DEFAULT '',
      body_size INTEGER NOT NULL DEFAULT 0,
      content_type TEXT,
      ip TEXT,
      received_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS deliveries (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      endpoint_id TEXT NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
      target_url TEXT NOT NULL,
      trigger TEXT NOT NULL DEFAULT 'auto',
      attempt INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'pending',
      status_code INTEGER,
      duration_ms INTEGER,
      error TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_events_endpoint ON events(endpoint_id, received_at DESC);
    CREATE INDEX IF NOT EXISTS idx_deliveries_event ON deliveries(event_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_deliveries_endpoint ON deliveries(endpoint_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
  `);
}

function seedDemo(database: DatabaseSync): void {
  const now = new Date().toISOString();
  database
    .prepare(
      `INSERT OR IGNORE INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)`,
    )
    .run(DEMO_USER_ID, 'demo@hookbay.dev', 'Demo', 'x', now);
  database
    .prepare(
      `INSERT OR IGNORE INTO workspaces (id, name, slug, owner_id, plan, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(DEMO_WORKSPACE_ID, 'Hookbay Demo', 'demo', DEMO_USER_ID, 'free', now);
  database
    .prepare(
      `INSERT OR IGNORE INTO endpoints (id, workspace_id, name, slug, secret, forward_url, forward_enabled, is_demo, created_at)
       VALUES (?, ?, ?, ?, ?, NULL, 0, 1, ?)`,
    )
    .run(
      DEMO_ENDPOINT_ID,
      DEMO_WORKSPACE_ID,
      'Public sandbox',
      DEMO_ENDPOINT_SLUG,
      randomSecret(),
      now,
    );
}

function createDatabase(): DatabaseSync {
  mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const database = new DatabaseSync(DB_PATH);
  database.exec('PRAGMA journal_mode = WAL;');
  database.exec('PRAGMA foreign_keys = ON;');
  database.exec('PRAGMA busy_timeout = 5000;');
  migrate(database);
  seedDemo(database);
  return database;
}

export const db: DatabaseSync =
  globalThis.__hookbayDb ?? (globalThis.__hookbayDb = createDatabase());

export function newId(): string {
  return randomUUID();
}

export function randomSecret(): string {
  return `whsec_${randomBytes(24).toString('hex')}`;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

interface WorkspaceRow {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  plan: string;
  created_at: string;
}

interface EndpointRow {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  secret: string;
  forward_url: string | null;
  forward_enabled: number;
  is_demo: number;
  created_at: string;
}

interface EventRow {
  id: string;
  endpoint_id: string;
  method: string;
  path: string;
  query: string;
  headers: string;
  body: string;
  body_size: number;
  content_type: string | null;
  ip: string | null;
  received_at: string;
}

interface DeliveryRow {
  id: string;
  event_id: string;
  endpoint_id: string;
  target_url: string;
  trigger: string;
  attempt: number;
  status: string;
  status_code: number | null;
  duration_ms: number | null;
  error: string | null;
  created_at: string;
}

function mapUser(row: UserRow): User {
  return { id: row.id, email: row.email, name: row.name, createdAt: row.created_at };
}

function mapWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    ownerId: row.owner_id,
    plan: row.plan === 'pro' ? 'pro' : 'free',
    createdAt: row.created_at,
  };
}

function mapEndpoint(row: EndpointRow): Endpoint {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    slug: row.slug,
    secret: row.secret,
    forwardUrl: row.forward_url,
    forwardEnabled: row.forward_enabled === 1,
    isDemo: row.is_demo === 1,
    createdAt: row.created_at,
  };
}

function parseJsonObject(value: string): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch {
    // ignore malformed
  }
  return {};
}

function mapEvent(row: EventRow): EventRecord {
  return {
    id: row.id,
    endpointId: row.endpoint_id,
    method: row.method,
    path: row.path,
    query: parseJsonObject(row.query),
    headers: parseJsonObject(row.headers),
    body: row.body,
    bodySize: row.body_size,
    contentType: row.content_type,
    ip: row.ip,
    receivedAt: row.received_at,
  };
}

function mapDelivery(row: DeliveryRow): Delivery {
  return {
    id: row.id,
    eventId: row.event_id,
    endpointId: row.endpoint_id,
    targetUrl: row.target_url,
    trigger: row.trigger === 'replay' ? 'replay' : 'auto',
    attempt: row.attempt,
    status: row.status as DeliveryStatus,
    statusCode: row.status_code,
    durationMs: row.duration_ms,
    error: row.error,
    createdAt: row.created_at,
  };
}

export const users = {
  findByEmail(email: string): (User & { passwordHash: string }) | null {
    const row = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email.toLowerCase()) as unknown as (UserRow & { password_hash: string }) | undefined;
    if (!row) return null;
    return { ...mapUser(row), passwordHash: row.password_hash };
  },
  findById(id: string): User | null {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as unknown as
      UserRow | undefined;
    return row ? mapUser(row) : null;
  },
  create(input: { email: string; name: string; passwordHash: string }): User {
    const id = newId();
    const createdAt = new Date().toISOString();
    db.prepare(
      'INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)',
    ).run(id, input.email.toLowerCase(), input.name, input.passwordHash, createdAt);
    return { id, email: input.email.toLowerCase(), name: input.name, createdAt };
  },
};

export const workspaces = {
  findById(id: string): Workspace | null {
    const row = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(id) as unknown as
      WorkspaceRow | undefined;
    return row ? mapWorkspace(row) : null;
  },
  findByOwner(ownerId: string): Workspace | null {
    const row = db
      .prepare('SELECT * FROM workspaces WHERE owner_id = ?')
      .get(ownerId) as unknown as WorkspaceRow | undefined;
    return row ? mapWorkspace(row) : null;
  },
  create(input: { name: string; slug: string; ownerId: string }): Workspace {
    const id = newId();
    const createdAt = new Date().toISOString();
    db.prepare(
      'INSERT INTO workspaces (id, name, slug, owner_id, plan, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(id, input.name, input.slug, input.ownerId, 'free', createdAt);
    return {
      id,
      name: input.name,
      slug: input.slug,
      ownerId: input.ownerId,
      plan: 'free',
      createdAt,
    };
  },
  setPlan(id: string, plan: Plan): void {
    db.prepare('UPDATE workspaces SET plan = ? WHERE id = ?').run(plan, id);
  },
};

export const sessions = {
  create(input: {
    userId: string;
    tokenHash: string;
    expiresAt: string;
    userAgent: string | null;
  }): void {
    db.prepare(
      'INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(
      newId(),
      input.userId,
      input.tokenHash,
      input.expiresAt,
      new Date().toISOString(),
      input.userAgent,
    );
  },
  findUserByTokenHash(tokenHash: string): User | null {
    const row = db
      .prepare(
        `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ? AND s.expires_at > ?`,
      )
      .get(tokenHash, new Date().toISOString()) as unknown as UserRow | undefined;
    return row ? mapUser(row) : null;
  },
  destroy(tokenHash: string): void {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
  },
  destroyForUser(userId: string): void {
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
  },
};

export const endpointsRepo = {
  listByWorkspace(workspaceId: string): EndpointWithStats[] {
    const rows = db
      .prepare(
        `SELECT e.*, (SELECT COUNT(*) FROM events ev WHERE ev.endpoint_id = e.id) AS event_count,
                (SELECT MAX(received_at) FROM events ev WHERE ev.endpoint_id = e.id) AS last_event_at
         FROM endpoints e WHERE e.workspace_id = ? ORDER BY e.created_at ASC, e.rowid ASC`,
      )
      .all(workspaceId) as unknown as (EndpointRow & {
      event_count: number;
      last_event_at: string | null;
    })[];
    return rows.map((row) => ({
      ...mapEndpoint(row),
      eventCount: row.event_count,
      lastEventAt: row.last_event_at,
    }));
  },
  findById(id: string): Endpoint | null {
    const row = db.prepare('SELECT * FROM endpoints WHERE id = ?').get(id) as unknown as
      EndpointRow | undefined;
    return row ? mapEndpoint(row) : null;
  },
  findBySlug(slug: string): Endpoint | null {
    const row = db.prepare('SELECT * FROM endpoints WHERE slug = ?').get(slug) as unknown as
      EndpointRow | undefined;
    return row ? mapEndpoint(row) : null;
  },
  countForWorkspace(workspaceId: string): number {
    const row = db
      .prepare('SELECT COUNT(*) AS n FROM endpoints WHERE workspace_id = ?')
      .get(workspaceId) as unknown as { n: number };
    return row.n;
  },
  create(input: {
    workspaceId: string;
    name: string;
    slug: string;
    forwardUrl: string | null;
    forwardEnabled: boolean;
  }): Endpoint {
    const id = newId();
    const secret = randomSecret();
    const createdAt = new Date().toISOString();
    db.prepare(
      `INSERT INTO endpoints (id, workspace_id, name, slug, secret, forward_url, forward_enabled, is_demo, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    ).run(
      id,
      input.workspaceId,
      input.name,
      input.slug,
      secret,
      input.forwardUrl,
      input.forwardEnabled ? 1 : 0,
      createdAt,
    );
    return {
      id,
      workspaceId: input.workspaceId,
      name: input.name,
      slug: input.slug,
      secret,
      forwardUrl: input.forwardUrl,
      forwardEnabled: input.forwardEnabled,
      isDemo: false,
      createdAt,
    };
  },
  update(
    id: string,
    patch: { name?: string; forwardUrl?: string | null; forwardEnabled?: boolean },
  ): void {
    const current = endpointsRepo.findById(id);
    if (!current) return;
    db.prepare(
      'UPDATE endpoints SET name = ?, forward_url = ?, forward_enabled = ? WHERE id = ?',
    ).run(
      patch.name ?? current.name,
      patch.forwardUrl === undefined ? current.forwardUrl : patch.forwardUrl,
      (patch.forwardEnabled === undefined ? current.forwardEnabled : patch.forwardEnabled) ? 1 : 0,
      id,
    );
  },
  delete(id: string): void {
    db.prepare('DELETE FROM endpoints WHERE id = ? AND is_demo = 0').run(id);
  },
  rotateSecret(id: string): string {
    const secret = randomSecret();
    db.prepare('UPDATE endpoints SET secret = ? WHERE id = ?').run(secret, id);
    return secret;
  },
};

export const eventsRepo = {
  create(input: {
    endpointId: string;
    method: string;
    path: string;
    query: Record<string, string>;
    headers: Record<string, string>;
    body: string;
    bodySize: number;
    contentType: string | null;
    ip: string | null;
  }): EventRecord {
    const id = newId();
    const receivedAt = new Date().toISOString();
    db.prepare(
      `INSERT INTO events (id, endpoint_id, method, path, query, headers, body, body_size, content_type, ip, received_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      input.endpointId,
      input.method,
      input.path,
      JSON.stringify(input.query),
      JSON.stringify(input.headers),
      input.body,
      input.bodySize,
      input.contentType,
      input.ip,
      receivedAt,
    );
    return { id, receivedAt, ...input };
  },
  listByEndpoint(endpointId: string, limit: number): EventRecord[] {
    const rows = db
      .prepare(
        'SELECT * FROM events WHERE endpoint_id = ? ORDER BY received_at DESC, rowid DESC LIMIT ?',
      )
      .all(endpointId, limit) as unknown as EventRow[];
    return rows.map(mapEvent);
  },
  findById(id: string): EventRecord | null {
    const row = db.prepare('SELECT * FROM events WHERE id = ?').get(id) as unknown as
      EventRow | undefined;
    return row ? mapEvent(row) : null;
  },
  deleteById(id: string): void {
    db.prepare('DELETE FROM events WHERE id = ?').run(id);
  },
  clearEndpoint(endpointId: string): void {
    db.prepare('DELETE FROM events WHERE endpoint_id = ?').run(endpointId);
  },
  trimEndpoint(endpointId: string, keep: number): void {
    db.prepare(
      `DELETE FROM events WHERE endpoint_id = ? AND id NOT IN (
         SELECT id FROM events WHERE endpoint_id = ? ORDER BY received_at DESC, rowid DESC LIMIT ?
       )`,
    ).run(endpointId, endpointId, keep);
  },
  countByEndpoint(endpointId: string): number {
    const row = db
      .prepare('SELECT COUNT(*) AS n FROM events WHERE endpoint_id = ?')
      .get(endpointId) as unknown as {
      n: number;
    };
    return row.n;
  },
  countAll(): number {
    const row = db.prepare('SELECT COUNT(*) AS n FROM events').get() as unknown as { n: number };
    return row.n;
  },
};

export const deliveriesRepo = {
  create(input: {
    eventId: string;
    endpointId: string;
    targetUrl: string;
    trigger: DeliveryTrigger;
    attempt: number;
    status: DeliveryStatus;
    statusCode: number | null;
    durationMs: number | null;
    error: string | null;
  }): Delivery {
    const id = newId();
    const createdAt = new Date().toISOString();
    db.prepare(
      `INSERT INTO deliveries (id, event_id, endpoint_id, target_url, trigger, attempt, status, status_code, duration_ms, error, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      input.eventId,
      input.endpointId,
      input.targetUrl,
      input.trigger,
      input.attempt,
      input.status,
      input.statusCode,
      input.durationMs,
      input.error,
      createdAt,
    );
    return { id, createdAt, ...input };
  },
  listByEvent(eventId: string): Delivery[] {
    const rows = db
      .prepare(
        'SELECT * FROM deliveries WHERE event_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 50',
      )
      .all(eventId) as unknown as DeliveryRow[];
    return rows.map(mapDelivery);
  },
  latestByEndpoint(endpointId: string, limit: number): Delivery[] {
    const rows = db
      .prepare(
        'SELECT * FROM deliveries WHERE endpoint_id = ? ORDER BY created_at DESC, rowid DESC LIMIT ?',
      )
      .all(endpointId, limit) as unknown as DeliveryRow[];
    return rows.map(mapDelivery);
  },
};
