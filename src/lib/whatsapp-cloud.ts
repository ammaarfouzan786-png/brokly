// Official WhatsApp Cloud API (Meta) client for the listing BOT — the ToS-safe production engine.
// (Distinct from src/lib/whatsapp.ts, which powers the CRM inbox send/poll.)
import crypto from 'crypto';

const VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0';
const GRAPH = `https://graph.facebook.com/${VERSION}`;
const TOKEN = process.env.WHATSAPP_TOKEN || '';
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const APP_SECRET = process.env.WHATSAPP_APP_SECRET || '';
export const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'brokly-verify';

export function verifyMetaSignature(rawBody: string, header: string | null): boolean {
  if (!APP_SECRET) return true; // skip if unset (dev)
  if (!header) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', APP_SECRET).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(header), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function sendTextCloud(to: string, text: string): Promise<unknown> {
  try {
    const res = await fetch(`${GRAPH}/${PHONE_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'text', text: { preview_url: true, body: text } }),
    });
    if (!res.ok) console.error('cloud sendText failed', res.status, await res.text().catch(() => ''));
    return res.ok;
  } catch (e) {
    console.error('cloud sendText error', e instanceof Error ? e.message : e);
    return false;
  }
}

export type CloudInbound = { from: string; messageId: string; text?: string; mediaIds: { id: string; mimetype?: string; filename?: string }[] };

export function parseMetaPayload(payload: any): CloudInbound[] {
  const out: CloudInbound[] = [];
  for (const entry of payload?.entry || []) {
    for (const change of entry?.changes || []) {
      const v = change?.value;
      if (!v?.messages) continue; // skip statuses/read receipts
      for (const m of v.messages) {
        const mediaIds: CloudInbound['mediaIds'] = [];
        let text = '';
        if (m.type === 'text') text = m.text?.body || '';
        else if (m.type === 'image') { text = m.image?.caption || ''; mediaIds.push({ id: m.image.id, mimetype: m.image.mime_type }); }
        else if (m.type === 'video') { text = m.video?.caption || ''; mediaIds.push({ id: m.video.id, mimetype: m.video.mime_type }); }
        else if (m.type === 'document') { text = m.document?.caption || ''; mediaIds.push({ id: m.document.id, mimetype: m.document.mime_type, filename: m.document.filename }); }
        else if (m.type === 'button') text = m.button?.text || '';
        else if (m.type === 'interactive') text = m.interactive?.button_reply?.title || m.interactive?.list_reply?.title || '';
        out.push({ from: m.from, messageId: m.id, text, mediaIds });
      }
    }
  }
  return out;
}

/** Download a media id → base64 (Meta media is a 2-step fetch: id -> signed url -> bytes). */
export async function downloadMediaBase64(mediaId: string): Promise<{ base64: string; mimetype: string } | null> {
  try {
    const metaRes = await fetch(`${GRAPH}/${mediaId}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (!metaRes.ok) return null;
    const meta = await metaRes.json();
    const binRes = await fetch(meta.url, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (!binRes.ok) return null;
    const buf = Buffer.from(await binRes.arrayBuffer());
    return { base64: buf.toString('base64'), mimetype: meta.mime_type || 'application/octet-stream' };
  } catch (e) {
    console.error('downloadMedia error', e instanceof Error ? e.message : e);
    return null;
  }
}
