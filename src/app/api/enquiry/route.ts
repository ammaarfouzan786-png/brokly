import { NextRequest, NextResponse } from 'next/server';
import { pushEnquiry, getEnquiriesSince } from '@/lib/link-store';
import { sendText } from '@/lib/whatsapp';
import { enquiryAutoReply } from '@/lib/messages';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** A buyer submits an enquiry from a public share link. */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}) as Record<string, string>);
  if (!b.propId || !b.slug) return NextResponse.json({ error: 'missing propId/slug' }, { status: 400 });
  const name = String(b.name || 'Live buyer');
  const phone = String(b.phone || '');
  const propTitle = String(b.propTitle || 'this property');
  await pushEnquiry({
    id: 'enq_' + Math.random().toString(36).slice(2, 10),
    slug: String(b.slug),
    propId: String(b.propId),
    propTitle,
    name,
    phone,
    msg: String(b.msg || 'Interested in this property'),
    ts: Date.now(),
  });
  // Instant WhatsApp acknowledgement to the buyer (simulated until Cloud API
  // creds are set). Best-effort — never block the enquiry on delivery.
  if (phone) {
    sendText(phone, enquiryAutoReply(name, propTitle)).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}

/** Broker app polls for enquiries received since a cursor. */
export async function GET(req: NextRequest) {
  const since = Number(req.nextUrl.searchParams.get('since') || '0') || 0;
  const { items, cursor } = await getEnquiriesSince(since);
  return NextResponse.json({ items, cursor });
}
