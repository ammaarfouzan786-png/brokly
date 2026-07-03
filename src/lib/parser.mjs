// Brokly listing parser: messy WhatsApp lead text -> structured Airbnb-level listing.
// Pure JS (Node fetch) so it runs in a test script AND is importable by Next API routes.
// Uses Gemini structured output (responseSchema) for reliable JSON, with a regex
// heuristic fallback so listings still work without a GEMINI_API_KEY.

const LISTING_SCHEMA = {
  type: 'object',
  properties: {
    category: { type: 'string', enum: ['residential', 'commercial', 'land', 'other'] },
    subtype: { type: 'string', description: 'e.g. apartment, villa, plot, office_space, retail_shop, pub_bar_fnb, warehouse' },
    transaction_type: { type: 'string', enum: ['sale', 'lease', 'sale_or_lease'] },
    title: { type: 'string', description: 'Crisp Airbnb-style title, <=70 chars' },
    headline: { type: 'string', description: 'One punchy sentence selling the place' },
    description: { type: 'string', description: '2-4 sentence professional description' },
    highlights: { type: 'array', items: { type: 'string' }, description: '4-8 short bullet highlights' },
    area_sqft: { type: 'integer', nullable: true },
    floor: { type: 'string', nullable: true },
    bedrooms: { type: 'integer', nullable: true },
    bathrooms: { type: 'integer', nullable: true },
    furnishing: { type: 'string', nullable: true },
    layout: { type: 'array', description: 'Rooms/units and their counts e.g. {item:"workstations",count:50}', items: { type: 'object', properties: {
      item: { type: 'string' }, count: { type: 'integer' } }, required: ['item', 'count'] } },
    capacity: { type: 'array', description: 'Capacity metrics e.g. {metric:"seated_pax",value:410}', items: { type: 'object', properties: {
      metric: { type: 'string' }, value: { type: 'integer' } }, required: ['metric', 'value'] } },
    amenities: { type: 'array', items: { type: 'string' } },
    licenses: { type: 'array', items: { type: 'object', properties: {
      type: { type: 'string' }, fee_inr: { type: 'integer', nullable: true }, deposit_inr: { type: 'integer', nullable: true } }, required: ['type'] } },
    pricing_options: { type: 'array', description: 'One entry per deal option (sale and/or lease)', items: { type: 'object', properties: {
      option: { type: 'string', enum: ['sale', 'rent', 'lease_with_setup'] },
      price_inr: { type: 'integer', nullable: true, description: 'sale asking price' },
      monthly_inr: { type: 'integer', nullable: true, description: 'monthly rent for this option' },
      floor_rent_monthly_inr: { type: 'integer', nullable: true, description: 'separate floor/landlord rent if stated alongside a sale' },
      deposit_inr: { type: 'integer', nullable: true },
      security_deposit_inr: { type: 'integer', nullable: true },
      negotiable: { type: 'string', enum: ['yes', 'no', 'slight', 'unknown'] },
      includes: { type: 'array', items: { type: 'string' } },
      notes: { type: 'string', nullable: true },
    }, required: ['option', 'negotiable'] } },
    location: { type: 'object', properties: {
      area: { type: 'string', nullable: true }, city: { type: 'string', nullable: true },
      maps_url: { type: 'string', nullable: true }, city_inferred: { type: 'boolean' } }, required: ['city_inferred'] },
    availability: { type: 'string', nullable: true, description: 'e.g. immediate, specific date' },
    needs_clarification: { type: 'array', items: { type: 'string' }, description: '2-4 missing fields the bot should ask the broker' },
  },
  required: ['category', 'subtype', 'transaction_type', 'title', 'headline', 'description', 'highlights', 'pricing_options', 'location', 'needs_clarification'],
};

const SYSTEM = `You are Brokly's listing engine for INDIAN real estate brokers. Convert a broker's messy WhatsApp property message into a clean, structured, Airbnb-quality listing.

RULES:
- Indian numbering: convert lakh/crore and comma-grouped Indian digits to plain integer rupees. Examples: "50 lakhs"=5000000, "4.5 crores"=45000000, "2,00,00,000"=20000000, "13,50,000"=1350000, "2,85,000"=285000, "6 Lakhs"=600000.
- CAPTURE EVERY RUPEE FIGURE — never drop a price, rent, deposit, fee or security amount. Each distinct amount maps to its own field: sale asking price -> price_inr; monthly rent -> monthly_inr; a separate floor/landlord rent quoted with a sale -> floor_rent_monthly_inr; refundable deposit -> deposit_inr; security deposit -> security_deposit_inr; licence fee/deposit -> licenses[].
- Handle COMMERCIAL types (office: workstations/cabins/conference/server room; F&B/pub: seated/standing pax, bar counters, liquor licence like CL-9) not just residential BHK. Put every room/unit count in layout[] and every capacity number in capacity[]. Do NOT leave layout/capacity empty if the message lists such counts.
- A single asset can have MULTIPLE deal options (outright SALE vs LEASE-WITH-SETUP). Emit one pricing_options entry per option with all its amounts.
- Recognise licences (e.g. Karnataka CL-9 bar licence) into licenses[] with fee_inr and deposit_inr when stated.
- LOCATION — do NOT hallucinate. NEVER infer area or city from a Google Maps URL; short map links are opaque. Put the link in location.maps_url. Only set area/city from a locality NAME written in the text. If a well-known written locality implies the city (e.g. "Koramangala"->Bengaluru), set city and city_inferred=true. If only a maps link is given with no written locality, set area=null, city=null, city_inferred=false.
- Write title/headline/description/highlights as polished marketing copy a premium broker would be proud to send. Do NOT invent facts (no fake amenities, areas, or prices).
- negotiable is REQUIRED on every pricing option: "yes"/"no"/"slight"/"unknown".
- needs_clarification: list the 2-4 most important missing fields (deposit, lock-in, furnishing, exact address, availability, revenue/P&L for a running business) so the bot can auto-ask the broker.
Return ONLY the JSON object.`;

/**
 * Gemini-backed parse. Default 2.5-pro (accuracy over speed; runs once per listing).
 * @param {string} text
 * @param {{ apiKey: string, model?: string }} opts
 * @returns {Promise<any>}
 */
export async function parseLeadToListing(text, { apiKey, model = 'gemini-2.5-pro' } = {}) {
  if (!apiKey) throw new Error('parseLeadToListing: missing apiKey');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ parts: [{ text: `Broker's WhatsApp message:\n"""${text}"""` }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json', responseSchema: LISTING_SCHEMA },
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error('Gemini: ' + data.error.message);
  const raw = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text).join('');
  return JSON.parse(raw);
}

// -------------------------------------------------------------- heuristic fallback

function titleCase(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

// Common Indian localities -> city, so the fallback can still infer a city sometimes.
const LOCALITY_CITY = {
  koramangala: 'Bengaluru', indiranagar: 'Bengaluru', whitefield: 'Bengaluru', hsr: 'Bengaluru',
  sarjapur: 'Bengaluru', hebbal: 'Bengaluru', bandra: 'Mumbai', andheri: 'Mumbai', sion: 'Mumbai',
  powai: 'Mumbai', worli: 'Mumbai', gurgaon: 'Gurgaon', gurugram: 'Gurugram', noida: 'Noida',
};

/** Best-effort structured listing without an LLM. Lower quality, but always available. */
export function heuristicParse(text) {
  const t = (text || '').trim();
  const lower = t.toLowerCase();

  let price = null;
  const crore = lower.match(/([\d.]+)\s*(cr|crore|crores)\b/);
  const lakh = lower.match(/([\d.]+)\s*(lakh|lakhs|lac|lacs|l)\b/);
  if (crore) price = Math.round(parseFloat(crore[1]) * 1e7);
  else if (lakh) price = Math.round(parseFloat(lakh[1]) * 1e5);
  else {
    const grouped = t.match(/(?:₹|rs\.?|inr)?\s*([\d,]{4,})/i);
    if (grouped) {
      const n = parseInt(grouped[1].replace(/,/g, ''), 10);
      if (Number.isFinite(n) && n >= 1000) price = n;
    }
  }

  const isRent = /(rent|lease|\/mo|per month|monthly|licen[cs]e|leave\s*&?\s*licen)/.test(lower);

  const bhkM = lower.match(/(\d(?:\.\d)?)\s*bhk/);
  const bedrooms = bhkM ? Math.round(parseFloat(bhkM[1])) : null;

  const sqftM = lower.match(/(\d{3,6})\s*(sq\.?\s?ft|sqft|sft|carpet|built[- ]?up)/);
  const area_sqft = sqftM ? parseInt(sqftM[1], 10) : null;

  const mapsUrl = (t.match(/https?:\/\/\S+/) || [null])[0];

  let area = null, city = null, cityInferred = false;
  for (const [loc, c] of Object.entries(LOCALITY_CITY)) {
    if (lower.includes(loc)) { area = titleCase(loc === 'hsr' ? 'HSR Layout' : loc); city = c; cityInferred = true; break; }
  }

  const config = bedrooms ? `${bedrooms}BHK` : 'Property';
  const where = area ? ` in ${area}` : '';
  const title = `${config}${where}`.slice(0, 70);
  const priceStr = price ? (price >= 1e7 ? `₹${(price / 1e7).toFixed(2).replace(/\.00$/, '')} Cr` : `₹${(price / 1e5).toFixed(2).replace(/\.00$/, '')} L`) : 'Price on request';
  const headline = `${config}${where} — ${priceStr}${isRent ? '/mo' : ''}`;

  const opt = isRent
    ? { option: 'rent', monthly_inr: price, negotiable: 'unknown', includes: [] }
    : { option: 'sale', price_inr: price, negotiable: 'unknown', includes: [] };

  return {
    category: 'residential',
    subtype: bedrooms ? 'apartment' : 'property',
    transaction_type: isRent ? 'lease' : 'sale',
    title,
    headline,
    description: t.slice(0, 400) || 'Property details shared on WhatsApp.',
    highlights: [bedrooms && `${bedrooms} BHK`, area_sqft && `${area_sqft} sqft`, area && `Located in ${area}`].filter(Boolean),
    area_sqft,
    floor: null,
    bedrooms,
    bathrooms: null,
    furnishing: /furnish/.test(lower) ? (/semi/.test(lower) ? 'semi-furnished' : 'furnished') : null,
    availability: /immediate/.test(lower) ? 'immediate' : null,
    layout: [],
    capacity: [],
    amenities: [/car park|parking/.test(lower) && 'Car parking', /gym/.test(lower) && 'Gym', /pool/.test(lower) && 'Swimming pool'].filter(Boolean),
    licenses: [],
    pricing_options: [opt],
    location: { area, city, maps_url: mapsUrl, city_inferred: cityInferred },
    needs_clarification: ['exact locality', 'deposit / security', 'furnishing', 'availability'].filter((_, i) => i < 3),
    _fallback: true,
  };
}

/**
 * Dispatcher: use Gemini when an apiKey is available, else the heuristic fallback.
 * @param {string} text
 * @param {{ apiKey?: string, model?: string }} [opts]
 */
export async function parseListing(text, { apiKey, model } = {}) {
  if (apiKey) {
    try {
      return await parseLeadToListing(text, { apiKey, model });
    } catch (e) {
      console.error('Gemini parse failed, using fallback:', e?.message);
      return heuristicParse(text);
    }
  }
  return heuristicParse(text);
}

export { LISTING_SCHEMA };
