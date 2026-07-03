// Currency + helpers for the LISTING subsystem (WhatsApp bot → Supabase listings).
// NOTE: money here is whole RUPEES (parser emits *_inr integers), which is a
// different convention from src/lib/money.ts (paise, used by the CRM screens).
// Keep them separate — this file is only for listings/leads.

/** 4500000 -> "₹45 L", 45000000 -> "₹4.5 Cr", 285000 -> "₹2.85 L". */
export function inrShort(n?: number | null): string {
  if (n == null) return '—';
  if (n >= 1e7) return `₹${trim(n / 1e7)} Cr`;
  if (n >= 1e5) return `₹${trim(n / 1e5)} L`;
  if (n >= 1e3) return `₹${trim(n / 1e3)} K`;
  return `₹${n}`;
}

/** 4500000 -> "₹45,00,000" (full Indian grouping). */
export function inrFull(n?: number | null): string {
  if (n == null) return '—';
  return '₹' + n.toLocaleString('en-IN');
}

function trim(x: number): string {
  return (Math.round(x * 100) / 100).toString();
}

export function slugify(s: string): string {
  return (s || 'listing')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

/** Short random suffix so slugs are unique without a DB round-trip. */
export function shortId(len = 6): string {
  const a = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += a[Math.floor(Math.random() * a.length)];
  return s;
}

/** Normalise an Indian phone to digits-only with country code (best effort). */
export function normalizePhone(raw: string): string {
  const d = (raw || '').replace(/\D/g, '');
  if (d.length === 10) return '91' + d;
  if (d.length === 12 && d.startsWith('91')) return d;
  if (d.length === 11 && d.startsWith('0')) return '91' + d.slice(1);
  return d;
}

/** The single price headline shown on a card, derived from pricing_options. */
export function priceHeadline(pricing: PricingOption[] | undefined | null): string {
  if (!pricing?.length) return 'Price on request';
  const parts = pricing
    .map((p) => {
      if (p.option === 'sale' && p.price_inr) return `${inrShort(p.price_inr)}`;
      if ((p.option === 'rent' || p.option === 'lease_with_setup') && p.monthly_inr) return `${inrShort(p.monthly_inr)}/mo`;
      return null;
    })
    .filter(Boolean);
  return parts.length ? parts.join('  ·  ') : 'Price on request';
}

// ---- Listing types (mirror the Gemini parser output + Supabase `properties`) ----

export interface PricingOption {
  option: 'sale' | 'rent' | 'lease_with_setup';
  price_inr?: number | null;
  monthly_inr?: number | null;
  floor_rent_monthly_inr?: number | null;
  deposit_inr?: number | null;
  security_deposit_inr?: number | null;
  negotiable?: 'yes' | 'no' | 'slight' | 'unknown';
  includes?: string[];
  notes?: string | null;
}

export interface ListingMedia {
  type: 'image' | 'video';
  url: string;
  mimetype?: string;
}

export interface ParsedListing {
  category: string;
  subtype: string;
  transaction_type: string;
  title: string;
  headline: string;
  description: string;
  highlights: string[];
  area_sqft?: number | null;
  floor?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  furnishing?: string | null;
  availability?: string | null;
  layout?: { item: string; count: number }[];
  capacity?: { metric: string; value: number }[];
  amenities?: string[];
  licenses?: { type: string; fee_inr?: number | null; deposit_inr?: number | null }[];
  pricing_options: PricingOption[];
  location: { area?: string | null; city?: string | null; maps_url?: string | null; city_inferred: boolean };
  needs_clarification: string[];
}

export interface Property extends ParsedListing {
  id: string;
  broker_id: string | null;
  slug: string;
  status: string;
  media: ListingMedia[];
  cover_url: string | null;
  views: number;
  created_at: string;
}
