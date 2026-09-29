import { NextResponse } from 'next/server';
import { ok } from '@/lib/api';
import { endSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(): Promise<NextResponse> {
  await endSession();
  return ok({ loggedOut: true });
}
