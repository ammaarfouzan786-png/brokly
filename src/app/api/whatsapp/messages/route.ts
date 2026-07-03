import { NextRequest, NextResponse } from 'next/server';
import { getInboundSince } from '@/lib/server-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Poll for inbound WhatsApp messages received since a cursor. */
export async function GET(req: NextRequest) {
  const since = Number(req.nextUrl.searchParams.get('since') || '0') || 0;
  const { items, cursor } = await getInboundSince(since);
  return NextResponse.json({ items, cursor });
}
