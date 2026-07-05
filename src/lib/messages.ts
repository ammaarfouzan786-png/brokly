// Brokly message engine — the WhatsApp copy a buyer actually receives, plus the
// AI-suggested replies the broker sees in the Inbox. Pure functions, no I/O, so
// they're trivial to unit-test and reuse on both the client and the API routes.
//
// Every rupee value in a `BuyerBrief` is paise (see money.ts) and is formatted
// through `formatInrShort`, never interpolated raw.

import type { ClientReq, Conversation } from './types';
import { formatInrShort } from './money';
import { activeBroker } from './broker';

export interface BuyerBrief {
  name?: string;
  type?: string; // 'Apartment' | 'Villa' | ...
  bhk?: number; // 0 / undefined = any
  area?: string;
  min?: number; // paise
  max?: number; // paise
}

/** First name only, and never echo back a bare phone number as a name. */
function firstName(full?: string): string {
  const f = (full || '').trim().split(/\s+/)[0] || '';
  return /^\+?\d+$/.test(f) ? '' : f;
}

/** " Priya" (leading space) or "" — so `Hi${hey(name)}!` reads naturally. */
function hey(name?: string): string {
  const f = firstName(name);
  return f ? ` ${f}` : '';
}

/** "₹1.6 Cr–₹1.9 Cr", "under ₹1.9 Cr", or "" when no budget is known. */
export function budgetPhrase(brief: BuyerBrief): string {
  const { min, max } = brief;
  if (min && max) return `${formatInrShort(min)}–${formatInrShort(max)}`;
  if (max) return `under ${formatInrShort(max)}`;
  if (min) return `${formatInrShort(min)}+`;
  return '';
}

/** "3BHK Apartment in Whitefield" — the brief in one human phrase. */
export function briefPhrase(brief: BuyerBrief): string {
  const config = brief.bhk ? `${brief.bhk}BHK ` : '';
  const kind = brief.type || 'home';
  const where = brief.area ? ` in ${brief.area}` : '';
  return `${config}${kind}${where}`.trim();
}

/** Map a stored client requirement to a brief for the message helpers. */
export function briefFromClient(c: ClientReq): BuyerBrief {
  return { name: c.name, type: c.type, bhk: c.bhk, area: c.area, min: c.min, max: c.max };
}

/**
 * The automated messages a buyer receives the first time they reach out (or the
 * broker first replies). Returns an ordered list of WhatsApp bubbles.
 */
export function firstContactMessages(brief: BuyerBrief = {}): string[] {
  const b = activeBroker();
  return [
    `Hi${hey(brief.name)}! 👋 This is ${b.name} from ${b.agency}. Thanks for reaching out.`,
    `I'll line up the best-matching homes for you. Could you share three quick things?\n📍 Preferred area\n🛏 BHK\n💰 Budget`,
    `Or just tell me what you're looking for in your own words — I'll take it from there.`,
  ];
}

/** Confirmation once the brief is captured, before the link goes out. */
export function briefAckMessage(brief: BuyerBrief): string {
  const b = budgetPhrase(brief);
  const budget = b ? `, ${b}` : '';
  return `Perfect — ${briefPhrase(brief)}${budget}. Curating your matches now… ⏳`;
}

/** The message that carries the first share link to the buyer. */
export function linkShareMessage(brief: BuyerBrief, url: string, count: number): string {
  const homes = count === 1 ? 'a home' : `${count} homes`;
  return (
    `Here ${count === 1 ? 'is' : 'are'} ${homes} handpicked for you${hey(brief.name)} 👇\n` +
    `${url}\n` +
    `Tap any card for photos, an AI price check and to enquire. This list updates itself as new matches come in.`
  );
}

/** The "your collection just grew" nudge sent when a smart link auto-updates. */
export function linkUpdatedMessage(opts: {
  brief: BuyerBrief;
  url: string;
  newTitle: string;
  count: number;
}): string {
  const { brief, url, newTitle, count } = opts;
  return (
    `Good news${hey(brief.name)}! A new match just came in — ${newTitle}. ` +
    `Your collection is now ${count} home${count === 1 ? '' : 's'} 👇\n${url}`
  );
}

/** Auto-reply the moment a buyer submits an enquiry from a public link.
 *  `brokerName` lets server callers speak as the broker who owns the link
 *  (the active-broker fallback only knows the real broker on their device). */
export function enquiryAutoReply(name: string | undefined, propTitle: string, brokerName?: string): string {
  const who = brokerName || activeBroker().name;
  return (
    `Thanks${hey(name)}! I've noted your interest in ${propTitle}. ` +
    `This is ${who} — would you like to visit this weekend? I can hold a slot 🗓`
  );
}

/**
 * Context-aware reply suggestions for the Inbox. Reads the last inbound message
 * and, for a brand-new chat the broker hasn't answered yet, opens with a
 * first-contact greeting. Returns up to three options.
 */
export function suggestReplies(conv: Conversation): string[] {
  const hasReplied = conv.msgs.some((m) => m.me);
  const last = conv.msgs.filter((m) => !m.me).slice(-1)[0];
  const t = (last?.t || '').toLowerCase();
  const s: string[] = [];

  if (!hasReplied) {
    const b = activeBroker();
    s.push(`Hi${hey(conv.name)}! ${b.name} here from ${b.agency} 👋 Happy to help you find the right home.`);
    s.push("Could you share your preferred area, BHK and budget? I'll send matched options right away.");
  }

  if (/visit|see it|saturday|sunday|weekend|today|tomorrow/.test(t)) s.push('Saturday 11am works — shall I confirm the visit?');
  if (/parking|car park/.test(t)) s.push('Yes, 2 covered car parks are included.');
  if (/price|budget|negoti|offer/.test(t)) s.push('The owner can consider a fair offer — what number works for you?');
  if (/loan|emi|finance|bank/.test(t)) s.push('Home-loan help is available — I can connect you with our banking partner.');
  if (/document|registration|khata|papers|title/.test(t)) s.push('All papers are clear — Khata, title and OC are in order. Happy to share copies.');
  if (/available|still there|sold/.test(t)) s.push('Yes, it’s still available — want me to block a viewing slot?');
  if (/co-?broke|50|split/.test(t)) s.push('Deal — 50:50 it is. Sending the agreement.');

  if (!s.length) s.push('Sharing the details now 👍', 'Can you share your budget & timeline?');
  return s.slice(0, 3);
}
