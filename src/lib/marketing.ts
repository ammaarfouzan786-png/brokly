// Brokly Marketing studio — the AI content template library.
// Ported/expanded from whatsapp-integration-try/prompts. Each template fills
// [PLACEHOLDER] tokens from the user's inputs; generation runs through Gemini
// (src/lib/gemini.ts) with a local fallback so it works without an API key.

export type MktCategory = 'Listing & copy' | 'Ads & social' | 'Client comms' | 'Analysis' | 'AI media';

export interface FieldDef {
  key: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'textarea';
}

export interface MktTemplate {
  id: string;
  title: string;
  emoji: string;
  category: MktCategory;
  desc: string;
  fields: FieldDef[];
  prompt: string; // uses [key] tokens matching field keys
  system?: string;
  /** AI-media prompts are meant to be copied into Veo/Sora/etc., not sent to Gemini. */
  copyOnly?: boolean;
}

export const CATEGORIES: MktCategory[] = ['Listing & copy', 'Ads & social', 'Client comms', 'Analysis', 'AI media'];

const F = {
  type: { key: 'type', label: 'Property type', placeholder: '3BHK apartment' },
  location: { key: 'location', label: 'Location', placeholder: 'Whitefield, Bengaluru' },
  price: { key: 'price', label: 'Price', placeholder: '₹1.45 Cr' },
  details: { key: 'details', label: 'Key details', placeholder: 'East-facing, 1575 sqft, 2 car parks, gated, pool + gym', type: 'textarea' as const },
} satisfies Record<string, FieldDef>;

export const COPY_SYSTEM = 'You are Brokly, a marketing assistant for Indian real-estate brokers. Use Indian English, ₹ (lakh/crore) figures, and a premium, trustworthy tone. Never invent facts not given. Output ready-to-send content only — no preamble.';

export const TEMPLATES: MktTemplate[] = [
  {
    id: 'listing-copy', title: 'Listing copy', emoji: '🏠', category: 'Listing & copy',
    desc: 'Premium portal-ready property description',
    fields: [F.type, F.location, F.price, F.details],
    prompt: 'Write a compelling property listing for a [type] in [location] priced at [price]. Details: [details]. Include configuration, area, amenities, nearby landmarks, lifestyle benefits, unique selling points and a persuasive call-to-action. Premium, trustworthy tone, optimised for property portals.',
  },
  {
    id: 'brochure', title: 'Project brochure', emoji: '📖', category: 'Listing & copy',
    desc: 'Luxury brochure sections for a project',
    fields: [{ key: 'project', label: 'Project name', placeholder: 'Prestige Lakeside' }, F.type, F.location, F.details],
    prompt: 'Write luxury project brochure content for [project], a [type] in [location]. Details: [details]. Produce sections: a tagline, overview, lifestyle narrative, amenities, specifications, location advantages, and a closing CTA. Premium tone.',
  },
  {
    id: 'social-post', title: 'Social post', emoji: '📸', category: 'Ads & social',
    desc: 'Instagram / Facebook / LinkedIn post',
    fields: [F.type, F.location, F.price, F.details],
    prompt: 'Create an engaging Instagram/Facebook/LinkedIn post promoting a [type] in [location] ([price]). Details: [details]. Include a scroll-stopping hook, emotional storytelling, key highlights, a strong CTA, relevant emojis, and 8-12 SEO-friendly hashtags.',
  },
  {
    id: 'ad-copy', title: 'Ad copy', emoji: '🎯', category: 'Ads & social',
    desc: 'High-converting FB / IG / Google ads',
    fields: [F.type, F.location, F.price, F.details],
    prompt: 'Write high-converting Facebook, Instagram and Google Ads copy for a [type] in [location] ([price]). Details: [details]. Provide 3 headlines, primary text, CTAs, emotional triggers, urgency and benefit bullets, and a lead-generation variant.',
  },
  {
    id: 'video-script', title: 'Reel script', emoji: '🎬', category: 'Ads & social',
    desc: '60-second reel / shorts script',
    fields: [F.type, F.location, F.price, F.details],
    prompt: 'Write a 60-second Instagram Reel / YouTube Shorts script for a [type] in [location] ([price]). Details: [details]. Give it shot-by-shot: timestamp, on-screen text, voiceover line, and B-roll suggestion, ending with a CTA.',
  },
  {
    id: 'follow-up', title: 'Follow-up message', emoji: '✉️', category: 'Client comms',
    desc: 'Re-engage a cold lead (WhatsApp/email)',
    fields: [{ key: 'client', label: 'Client name', placeholder: 'Priya' }, F.type, F.location],
    prompt: 'Write a warm, personalised follow-up message to a real-estate lead named [client] who enquired about a [type] in [location] but went quiet. Friendly and persuasive, with a soft CTA to book a site visit or call. Give a WhatsApp version (short) and an email version.',
  },
  {
    id: 'buyer-persona', title: 'Buyer persona', emoji: '👤', category: 'Analysis',
    desc: 'Who to target and how to pitch',
    fields: [F.type, F.location, F.price],
    prompt: 'Create a detailed buyer persona for a [type] in [location] priced [price]. Cover demographics, income band, motivations, likely objections, preferred channels, and 3 tailored pitch angles.',
  },
  {
    id: 'market-analysis', title: 'Market analysis', emoji: '📊', category: 'Analysis',
    desc: 'Location trends & 12-month outlook',
    fields: [F.location, F.type],
    prompt: 'Provide a concise location market analysis for [location], India, focused on [type]. Cover current price trends (₹/sqft), demand vs supply, rental yields, upcoming infrastructure, the typical buyer, and a 12-month outlook. Clearly label any figures as indicative.',
  },
  {
    id: 'roi', title: 'ROI analysis', emoji: '📈', category: 'Analysis',
    desc: 'Rental yield & investment case',
    fields: [F.type, F.location, F.price, { key: 'rent', label: 'Expected monthly rent', placeholder: '₹45,000' }],
    prompt: 'Give an investment ROI / rental-yield analysis for a [type] in [location] bought at [price] with expected monthly rent [rent]. Cover gross and net yield, likely appreciation, break-even horizon, key risks, and a clear verdict. Use ₹.',
  },
  {
    id: 'comparison', title: 'Compare two', emoji: '⚖️', category: 'Analysis',
    desc: 'Side-by-side for an undecided buyer',
    fields: [{ key: 'a', label: 'Property A', placeholder: '3BHK Prestige, Whitefield, ₹1.45 Cr', type: 'textarea' }, { key: 'b', label: 'Property B', placeholder: '3BHK Brigade, Hebbal, ₹1.18 Cr', type: 'textarea' }],
    prompt: 'Compare two properties for an undecided buyer. Property A: [a]. Property B: [b]. Compare price, location, amenities, appreciation potential and pros/cons in a clear table, then give a recommendation and the ideal buyer for each.',
  },
  {
    id: 'vastu', title: 'Vastu check', emoji: '🧭', category: 'Analysis',
    desc: 'Vastu strengths, issues & remedies',
    fields: [F.type, F.location, { key: 'facing', label: 'Facing', placeholder: 'East' }],
    prompt: 'Act as a practical Vastu consultant. Analyse a [type] in [location] that is [facing]-facing. List Vastu strengths, potential issues, and realistic remedies. Keep it balanced and reassuring, not alarmist.',
  },
  {
    id: 'floor-plan', title: 'Floor-plan review', emoji: '📐', category: 'Analysis',
    desc: 'Architect-style layout critique',
    fields: [{ key: 'details', label: 'Describe the plan', placeholder: '3BHK, 1575 sqft, living-dining combined, kitchen NE, 2 balconies…', type: 'textarea' }],
    prompt: 'Act as an architect reviewing a floor plan described as: [details]. Comment on layout efficiency, natural light and ventilation, privacy zoning, Vastu, and suggest 3 concrete improvements.',
  },
  // ---- AI media (copy into external image/video tools) ----
  {
    id: 'media-render', title: 'Photoreal render', emoji: '🖼️', category: 'AI media', copyOnly: true,
    desc: 'Prompt for a DSLR-style interior render',
    fields: [{ key: 'space', label: 'Space', placeholder: 'living room' }, { key: 'style', label: 'Style', placeholder: 'warm contemporary Indian' }],
    prompt: 'Photorealistic architectural visualization of a [style] [space], shot on a full-frame DSLR with a 24mm lens, natural golden-hour light through large windows, soft global illumination, physically-based materials, shallow depth of field, 8k, ultra-detailed, magazine interior photography. No text, no watermark.',
  },
  {
    id: 'media-drone', title: 'FPV drone flythrough', emoji: '🚁', category: 'AI media', copyOnly: true,
    desc: 'Prompt for a cinematic property video',
    fields: [{ key: 'space', label: 'Property', placeholder: '4BHK penthouse with rooftop pool' }],
    prompt: 'Cinematic FPV drone fly-through of a [space], smooth fast dolly through doorways and out over the balcony, golden-hour lighting, volumetric light, 24fps motion blur, anamorphic lens flares, high dynamic range, photoreal, 4k. Continuous single take.',
  },
  {
    id: 'media-assembly', title: '"Room assembles" clip', emoji: '✨', category: 'AI media', copyOnly: true,
    desc: 'Prompt for a 5s archviz animation',
    fields: [{ key: 'space', label: 'Room', placeholder: 'modular kitchen' }, { key: 'style', label: 'Style', placeholder: 'minimal luxury' }],
    prompt: '5-second fixed-camera architectural animation: an empty [space] assembles itself — furniture, [style] finishes, lighting and décor fly in and settle into place, satisfying smooth easing, soft studio lighting, photoreal archviz, 4k, no text.',
  },
];

export const templateById = (id: string) => TEMPLATES.find((t) => t.id === id);

export function fillPrompt(tpl: MktTemplate, vars: Record<string, string>): string {
  return tpl.prompt.replace(/\[(\w+)\]/g, (_, k) => (vars[k] || '').trim() || `(${k} not specified)`);
}

/** Local fallback content when no GEMINI_API_KEY — keeps the studio usable in demo. */
export function fallbackOutput(tpl: MktTemplate, vars: Record<string, string>): string {
  const type = vars.type || 'property';
  const loc = vars.location || 'a prime location';
  const price = vars.price || 'a great price';
  const details = vars.details || '';
  switch (tpl.category) {
    case 'Listing & copy':
      return `✨ ${type} in ${loc} — ${price}\n\nA rare find in ${loc}. ${details ? details + '. ' : ''}Thoughtfully designed, move-in ready, and priced to sell. Enjoy premium amenities, excellent connectivity, and a lifestyle upgrade your family deserves.\n\n📞 Serious buyers only — DM to arrange a private viewing this week.\n\n(Set GEMINI_API_KEY for full AI-written copy.)`;
    case 'Ads & social':
      return `🏡 ${type.toUpperCase()} · ${loc}\n${price} — enquire today 👇\n\nHook: Stop scrolling — this ${type} won't last.\n${details ? '• ' + details.split(',').map((s) => s.trim()).filter(Boolean).join('\n• ') + '\n' : ''}CTA: DM "INTERESTED" for the full listing + video.\n\n#RealEstate #${loc.replace(/[^a-zA-Z]/g, '')} #PropertyForSale #DreamHome #Brokly\n\n(Set GEMINI_API_KEY for multiple AI-generated variants.)`;
    case 'Client comms':
      return `WhatsApp:\nHi ${vars.client || 'there'} 👋 Just circling back on the ${type} in ${loc} you liked. It's still available and getting strong interest. Free for a quick site visit this weekend?\n\nEmail:\nSubject: Still interested in ${loc}?\n\nHi ${vars.client || 'there'},\nThanks again for your interest in the ${type} in ${loc}. I'd love to help you see it in person — would Saturday or Sunday suit you? Happy to answer any questions in the meantime.\n\nWarm regards,\nAmmar · Ammar Estates\n\n(Set GEMINI_API_KEY for fully personalised drafts.)`;
    case 'AI media':
      return fillPrompt(tpl, vars);
    default:
      return `Analysis for ${type} in ${loc} (${price}).\n\n${details}\n\nConnect a GEMINI_API_KEY to generate the full AI analysis. Meanwhile, use this as a starting outline.`;
  }
}
