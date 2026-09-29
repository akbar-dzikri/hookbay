import { NextResponse } from 'next/server';
import { ok } from '@/lib/api';
import { eventsRepo } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  return ok({
    service: 'hookbay',
    status: 'healthy',
    time: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    eventsReceived: eventsRepo.countAll(),
    node: process.version,
  });
}
