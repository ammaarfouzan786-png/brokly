import { supabaseAdmin } from './supabase';
import { broadcastLead } from './realtime';
import { slugify, shortId, normalizePhone } from './listing-format';
import { parseListing } from './parser.mjs';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-pro';

export async function ensureBroker({ phone, name }: { phone: string; name?: string }) {
  const db = supabaseAdmin();
  const p = normalizePhone(phone);
  const { data: existing } = await db.from('brokers').select('*').eq('phone', p).maybeSingle();
  if (existing) return existing;
  const { data, error } = await db
    .from('brokers')
    .insert({ phone: p, name: name || null, slug: slugify(name || 'broker') + '-' + shortId(4) })
    .select('*')
    .single();
  if (error) throw new Error('ensureBroker: ' + error.message);
  return data;
}

/** Parse a messy WhatsApp lead into a listing and persist it. Returns the property row. */
export async function createListingFromText({
  text,
  brokerId,
  media = [],
}: {
  text: string;
  brokerId?: string;
  media?: { type: string; url: string; mimetype?: string }[];
}) {
  // Gemini when GEMINI_API_KEY is set; otherwise a heuristic fallback (lower quality but works).
  const parsed = await parseListing(text, { apiKey: process.env.GEMINI_API_KEY, model: MODEL });

  const db = supabaseAdmin();
  const slug = slugify(parsed.title || parsed.subtype || 'listing') + '-' + shortId(6);
  const cover = media.find((m) => m.type === 'image')?.url || null;

  const row = {
    broker_id: brokerId || null,
    slug,
    status: 'published',
    category: parsed.category,
    subtype: parsed.subtype,
    transaction_type: parsed.transaction_type,
    title: parsed.title,
    headline: parsed.headline,
    description: parsed.description,
    highlights: parsed.highlights || [],
    area_sqft: parsed.area_sqft ?? null,
    floor: parsed.floor ?? null,
    bedrooms: parsed.bedrooms ?? null,
    bathrooms: parsed.bathrooms ?? null,
    furnishing: parsed.furnishing ?? null,
    availability: parsed.availability ?? null,
    layout: parsed.layout || [],
    capacity: parsed.capacity || [],
    amenities: parsed.amenities || [],
    licenses: parsed.licenses || [],
    pricing_options: parsed.pricing_options || [],
    location: parsed.location || {},
    needs_clarification: parsed.needs_clarification || [],
    media,
    cover_url: cover,
    raw_source: text,
    parsed,
  };
  const { data, error } = await db.from('properties').insert(row).select('*').single();
  if (error) throw new Error('createListing: ' + error.message);
  return data;
}

/** Create or bump an enquiry lead for a property (from a buyer's WhatsApp message). */
export async function upsertLeadFromEnquiry({
  brokerId,
  propertyId,
  phone,
  name,
  message,
  source = 'listing_whatsapp',
}: {
  brokerId?: string;
  propertyId?: string;
  phone: string;
  name?: string;
  message?: string;
  source?: string;
}) {
  const db = supabaseAdmin();
  const p = normalizePhone(phone);
  let lead;
  const { data: existing } = await db
    .from('leads')
    .select('*')
    .eq('phone', p)
    .eq('property_id', propertyId || '')
    .maybeSingle();
  if (existing) {
    const { data } = await db
      .from('leads')
      .update({ last_msg_at: new Date().toISOString(), score: Math.min(100, (existing.score || 50) + 5) })
      .eq('id', existing.id)
      .select('*')
      .single();
    lead = data;
  } else {
    const { data, error } = await db
      .from('leads')
      .insert({ broker_id: brokerId || null, property_id: propertyId || null, phone: p, name: name || null, message: message || null, source, heat: 'hot', score: 70 })
      .select('*')
      .single();
    if (error) throw new Error('upsertLead: ' + error.message);
    lead = data;
  }
  if (message) {
    await db.from('messages').insert({ lead_id: lead.id, broker_id: brokerId || null, direction: 'in', body: message });
  }
  if (lead.property_id) {
    const { data: prop } = await db.from('properties').select('title,slug,cover_url').eq('id', lead.property_id).maybeSingle();
    lead.properties = prop || undefined;
  }
  await broadcastLead(lead);
  return lead;
}
