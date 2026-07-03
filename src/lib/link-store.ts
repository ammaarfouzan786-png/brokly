import { kv } from './kv';

// Published share links + buyer enquiries, on the durable KV layer so a link
// opened on a buyer's device resolves and their enquiry flows back to the
// broker — even across serverless invocations.

export interface LinkProp {
  id: string;
  title: string;
  area: string;
  type: string;
  bhk: number;
  sqft: number;
  price: number; // paise
  gradient: string;
  imageUrl?: string;
  score?: number;
  isNew?: boolean; // freshly added on the latest auto-update — badged in the buyer view
}

export interface LinkPayload {
  slug: string;
  kind: 'single' | 'collection';
  label: string;
  brokerName: string;
  brokerScore: number;
  props: LinkProp[];
  created: number;
  updated?: number; // last time the collection changed; > created once it auto-updates
}

export interface EnquiryRecord {
  id: string;
  slug: string;
  propId: string;
  propTitle: string;
  name: string;
  phone: string;
  msg: string;
  ts: number;
}

const ENQ = 'enquiries';
const linkKey = (slug: string) => 'link:' + slug;

export async function publishLink(p: LinkPayload): Promise<void> {
  if (!p?.slug) return;
  await kv.set(linkKey(p.slug), p);
}

export async function getLink(slug: string): Promise<LinkPayload | null> {
  return await kv.get<LinkPayload>(linkKey(slug));
}

export async function pushEnquiry(r: EnquiryRecord): Promise<void> {
  await kv.rpush(ENQ, r);
}

export async function getEnquiriesSince(cursor: number): Promise<{ items: EnquiryRecord[]; cursor: number }> {
  const len = await kv.llen(ENQ);
  const items = cursor >= len ? [] : await kv.lrange<EnquiryRecord>(ENQ, cursor, -1);
  return { items, cursor: len };
}
