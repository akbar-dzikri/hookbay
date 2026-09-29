import { NextResponse } from 'next/server';
import { fail, ok } from '@/lib/api';
import { ensureSimulator, emitSample } from '@/lib/simulator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(): Promise<NextResponse> {
  ensureSimulator();
  const event = emitSample();
  if (!event) return fail('Sandbox endpoint unavailable', 'ERR_DEMO_MISSING', 503);
  return ok({ event }, { status: 201 });
}
