import { NextRequest, NextResponse } from 'next/server';
import { publishLink, getLink, type LinkPayload } from '@/lib/link-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Broker app publishes a link's resolved snapshot so buyers can open it. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as LinkPayload | null;
  if (!body || !body.slug) return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
  await publishLink(body);
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') || '';
  const link = await getLink(slug);
  if (!link) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(link);
}
