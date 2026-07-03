import { NextResponse } from 'next/server';
import { handleBotMessage } from '@/lib/bot';
import { verifyMetaSignature, sendTextCloud, parseMetaPayload, downloadMediaBase64, VERIFY_TOKEN } from '@/lib/whatsapp-cloud';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Meta webhook verification handshake.
export function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  if (mode === 'subscribe' && token === VERIFY_TOKEN) return new Response(challenge || '', { status: 200 });
  return new Response('Forbidden', { status: 403 });
}

// Inbound WhatsApp (Cloud API) → shared listing bot. (Production engine; OpenWA is the demo one.)
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyMetaSignature(raw, req.headers.get('x-hub-signature-256'))) {
    return NextResponse.json({ error: 'bad signature' }, { status: 401 });
  }
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: true });
  }

  for (const m of parseMetaPayload(payload)) {
    const media: { mimetype: string; base64: string; filename?: string }[] = [];
    for (const md of m.mediaIds) {
      const dl = await downloadMediaBase64(md.id);
      if (dl) media.push({ mimetype: dl.mimetype, base64: dl.base64, filename: md.filename });
    }
    await handleBotMessage({ from: m.from, replyTo: m.from, text: m.text, media, messageId: m.messageId }, sendTextCloud);
  }
  return NextResponse.json({ ok: true });
}
