import { kv } from './kv';

// Inbound WhatsApp messages received by the webhook, drained by the client via
// /api/whatsapp/messages. Backed by the durable KV list (Upstash/Vercel KV in
// production, in-memory locally).

export interface InboundRecord {
  from: string;
  name?: string;
  text: string;
  type?: 'text' | 'image';
  mediaId?: string;
  caption?: string;
  mime?: string;
  waId?: string;
  ts: number;
}

const KEY = 'wa:inbound';

export async function pushInbound(r: InboundRecord): Promise<void> {
  await kv.rpush(KEY, r);
}

/** Records newer than `cursor` plus the new cursor (total count). */
export async function getInboundSince(cursor: number): Promise<{ items: InboundRecord[]; cursor: number }> {
  const len = await kv.llen(KEY);
  const items = cursor >= len ? [] : await kv.lrange<InboundRecord>(KEY, cursor, -1);
  return { items, cursor: len };
}
