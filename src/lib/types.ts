export type Plan = 'free' | 'pro';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type DeliveryStatus = 'pending' | 'success' | 'failed';

export type DeliveryTrigger = 'auto' | 'replay';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  plan: Plan;
  createdAt: string;
}

export interface Endpoint {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  secret: string;
  forwardUrl: string | null;
  forwardEnabled: boolean;
  isDemo: boolean;
  createdAt: string;
}

export interface EndpointWithStats extends Endpoint {
  eventCount: number;
  lastEventAt: string | null;
}

export interface EventRecord {
  id: string;
  endpointId: string;
  method: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  body: string;
  bodySize: number;
  contentType: string | null;
  ip: string | null;
  receivedAt: string;
}

export interface Delivery {
  id: string;
  eventId: string;
  endpointId: string;
  targetUrl: string;
  trigger: DeliveryTrigger;
  attempt: number;
  status: DeliveryStatus;
  statusCode: number | null;
  durationMs: number | null;
  error: string | null;
  createdAt: string;
}

export interface SessionUser {
  user: User;
  workspace: Workspace;
}
