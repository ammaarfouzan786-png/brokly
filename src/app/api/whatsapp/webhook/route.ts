import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { VERIFY_TOKEN, APP_SECRET } from '@/lib/whatsapp';
import { pushInbound } from '@/lib/server-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Webhook verification handshake (Meta calls this once when you subscribe). */
export function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const mode = p.get('hub.mode');
  const token = p.get('hub.verify_token');
  const challenge = p.get('hub.challenge');
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge ?? '', { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

/** Inbound messages (text + image) + status callbacks. Must respond 200 fast. */
export async function POST(req: NextRequest) {
  const raw = await req.text();

  if (APP_SECRET) {
    const sig = req.headers.get('x-hub-signature-256') || '';
    const expected = 'sha256=' + crypto.createHmac('sha256', APP_SECRET).update(raw).digest('hex');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return new NextResponse('bad signature', { status: 401 });
    }
  }

  try {
    const body = JSON.parse(raw);
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value || {};
        const nameByWa: Record<string, string> = {};
        for (const c of value.contacts || []) {
          if (c.wa_id) nameByWa[c.wa_id] = c.profile?.name || c.wa_id;
        }
        for (const m of value.messages || []) {
          const from: string = m.from;
          const ts = (Number(m.timestamp) || Date.now() / 1000) * 1000;

          if (m.type === 'image' && m.image) {
            await pushInbound({
              from, name: nameByWa[from], type: 'image',
              mediaId: m.image.id, caption: m.image.caption || '', mime: m.image.mime_type,
              text: m.image.caption || '📷 Photo', waId: m.id, ts,
            });
          } else {
            const text: string =
              m.text?.body ||
              m.button?.text ||
              m.interactive?.list_reply?.title ||
              m.interactive?.button_reply?.title ||
              (m.type ? `[${m.type} message]` : '[message]');
            await pushInbound({ from, name: nameByWa[from], type: 'text', text, waId: m.id, ts });
          }
        }
      }
    }
  } catch {
    // Never fail Meta's delivery on a parse error.
  }

  return NextResponse.json({ received: true });
}
