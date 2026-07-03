import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TOKEN = process.env.WHATSAPP_TOKEN || '';
const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0';

/**
 * Streams a WhatsApp media object by id. Cloud API media URLs are short-lived
 * and require the access token, so we resolve + proxy them here.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!TOKEN) return new NextResponse('WhatsApp not configured', { status: 503 });

  try {
    const metaRes = await fetch(`https://graph.facebook.com/${API_VERSION}/${id}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    if (!metaRes.ok) return new NextResponse('media lookup failed', { status: 502 });
    const meta = await metaRes.json();
    if (!meta?.url) return new NextResponse('media url missing', { status: 404 });

    const bin = await fetch(meta.url, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (!bin.ok) return new NextResponse('media fetch failed', { status: 502 });
    const buf = await bin.arrayBuffer();

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': meta.mime_type || bin.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return new NextResponse('error', { status: 500 });
  }
}
