// Client + payload adapter for the self-hosted OpenWA gateway (fast QR-based demo engine).
import crypto from 'crypto';

const BASE = process.env.OPENWA_BASE_URL || 'http://localhost:2785';
const API_KEY = process.env.OPENWA_API_KEY || '';
const SESSION_ID = process.env.OPENWA_SESSION_ID || 'brokly';

// OpenWA send: POST /api/sessions/:id/messages/send-text {chatId,text}, auth X-API-Key.
export async function sendText(chatId: string, text: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/api/sessions/${SESSION_ID}/messages/send-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(API_KEY ? { 'X-API-Key': API_KEY } : {}) },
      body: JSON.stringify({ chatId, text }),
    });
    if (!res.ok) console.error('openwa sendText failed', res.status, await res.text().catch(() => ''));
    return res.ok;
  } catch (e) {
    console.error('openwa sendText error', e instanceof Error ? e.message : e);
    return false;
  }
}

// Verify OpenWA's HMAC: header `X-OpenWA-Signature: sha256=<hex>` over the raw JSON body.
export function verifySignature(rawBody: string, header: string | null, secret?: string): boolean {
  if (!secret) return true; // no secret configured => skip (dev)
  if (!header) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(header), Buffer.from(expected));
  } catch {
    return false;
  }
}

export type Inbound = {
  from?: string;
  chatId?: string;
  text?: string;
  type?: string;
  fromMe?: boolean;
  isGroup?: boolean;
  isStatus?: boolean;
  event?: string;
  media: { mimetype: string; base64: string; filename?: string }[];
};

export function readInbound(payload: any): Inbound {
  const d = payload?.data ?? payload ?? {};
  const from = (d.author || d.from || d.chatId || d.senderPhone || '').toString().replace(/@.*$/, '');
  const media: Inbound['media'] = [];
  if (d.media?.data && !d.media?.omitted) {
    media.push({ mimetype: d.media.mimetype || 'application/octet-stream', base64: d.media.data, filename: d.media.filename });
  }
  return {
    from,
    chatId: (d.chatId || d.from || '').toString(),
    text: d.body ?? d.caption ?? '',
    type: d.type,
    fromMe: !!d.fromMe,
    isGroup: !!d.isGroup,
    isStatus: !!d.isStatusBroadcast,
    event: payload?.event,
    media,
  };
}
