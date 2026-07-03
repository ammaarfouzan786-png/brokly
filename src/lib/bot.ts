// Engine-agnostic Brokly listing bot. Both the OpenWA webhook and the WhatsApp Cloud API webhook
// normalise their payload into BotMessage and call handleBotMessage() — the one source of truth for
// the "Hi → forward text + photos/videos → DONE → listing" flow.
import { isSupabaseConfigured, supabaseAdmin } from './supabase';
import { ensureBroker, createListingFromText } from './db';
import { uploadBase64 } from './storage';
import { normalizePhone } from './listing-format';

export const GREET = `👋 Welcome to *Brokly*.\n\n📸 Send me a property's photos/videos and details (price, area, locality, BHK or layout, amenities) in any order.\n\nType *DONE* when you're finished and I'll build a beautiful listing page in ~30 seconds. Type *CANCEL* to start over.`;

export type BotMedia = { mimetype: string; base64: string; filename?: string };
export type BotMessage = {
  from: string; // sender phone (broker identity)
  replyTo?: string; // where to send replies (JID/phone); defaults to `from`
  text?: string;
  media?: BotMedia[];
  fromMe?: boolean;
  isGroup?: boolean;
  isStatus?: boolean;
  messageId?: string; // for idempotency (dedupe webhook retries)
};
export type SendFn = (to: string, text: string) => Promise<unknown>;

export async function handleBotMessage(msg: BotMessage, send: SendFn): Promise<void> {
  if (msg.fromMe || msg.isGroup || msg.isStatus || !msg.from) return;

  const phone = normalizePhone(msg.from);
  const reply = msg.replyTo || phone;

  // Without Supabase we can't persist sessions/listings — fail gracefully.
  if (!isSupabaseConfigured()) {
    await send(reply, '⚠️ Brokly isn’t fully set up yet (server storage). Please try again shortly.');
    return;
  }

  const db = supabaseAdmin();

  // idempotency: skip if we've already processed this provider message id.
  if (msg.messageId) {
    const { error } = await db.from('wa_processed').insert({ message_id: msg.messageId });
    if (error?.code === '23505') return; // duplicate delivery
    if (error) console.error('wa_processed guard (non-fatal):', error.message);
  }

  const text = msg.text || '';
  const cmd = text.trim().toUpperCase();

  const broker = await ensureBroker({ phone });
  const { data: session } = await db.from('wa_sessions').select('*').eq('broker_phone', phone).maybeSingle();
  const buffer = session?.buffer_text || '';
  const bufMedia: { type: string; url: string; mimetype?: string }[] = session?.media || [];
  const isGreeting = /^(HI+|HELLO|HEY|START|MENU)$/.test(cmd);

  if (isGreeting && !buffer) {
    await db.from('wa_sessions').upsert({ broker_phone: phone, broker_id: broker.id, status: 'collecting', buffer_text: '', media: [] });
    await send(reply, GREET);
    return;
  }

  if (cmd === 'CANCEL') {
    await db.from('wa_sessions').upsert({ broker_phone: phone, broker_id: broker.id, status: 'collecting', buffer_text: '', media: [] });
    await send(reply, '🗑️ Cleared. Send a new property whenever you like, or type *HI* for instructions.');
    return;
  }

  if (cmd === 'DONE') {
    if (!buffer.trim()) {
      await send(reply, "I don't have any property details yet 🙈 — send the price, area and locality first, then type *DONE*.");
      return;
    }
    await send(reply, '📥 Got it! Give me ~30 seconds to design your listing…');
    try {
      const listing = await createListingFromText({ text: buffer, brokerId: broker.id, media: bufMedia });
      const base = process.env.NEXT_PUBLIC_APP_URL || '';
      const url = `${base}/listing/${listing.slug}`;
      let out = `✅ Your listing is live:\n${url}\n\n*${listing.title}*\n${listing.headline}`;
      if (listing.needs_clarification?.length) out += `\n\nTo make it even better, reply with:\n• ${listing.needs_clarification.join('\n• ')}`;
      out += `\n\n📊 Manage & track leads: ${base}/dashboard`;
      await send(reply, out);
      await db.from('wa_sessions').upsert({ broker_phone: phone, broker_id: broker.id, status: 'done', buffer_text: '', media: [] });
    } catch (e) {
      await send(reply, '⚠️ Something went wrong building that listing. Please try again or type *CANCEL* to restart.');
      console.error('listing build failed', e instanceof Error ? e.message : e);
    }
    return;
  }

  // accumulate text + media into the draft
  const uploaded: { type: string; url: string; mimetype?: string }[] = [];
  for (const m of msg.media || []) {
    const r = await uploadBase64(m.base64, m.mimetype, phone, m.filename);
    if (r) uploaded.push(r);
  }
  const newBuffer = (buffer ? buffer + '\n' : '') + text;
  const newMedia = [...bufMedia, ...uploaded];
  await db.from('wa_sessions').upsert({
    broker_phone: phone,
    broker_id: broker.id,
    status: 'collecting',
    buffer_text: newBuffer,
    media: newMedia,
    updated_at: new Date().toISOString(),
  });
  const imgs = newMedia.filter((m) => m.type === 'image').length;
  const vids = newMedia.filter((m) => m.type === 'video').length;
  const tally = [imgs && `${imgs} photo${imgs > 1 ? 's' : ''}`, vids && `${vids} video${vids > 1 ? 's' : ''}`].filter(Boolean).join(', ');
  await send(reply, `Got it ✓ ${tally ? `(${tally} saved) ` : ''}Send more, or type *DONE* to publish.`);
}
