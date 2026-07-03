import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase';
import { inrFull, inrShort, type PricingOption } from '@/lib/listing-format';
import { EnquireButton } from './EnquireButton';

export const dynamic = 'force-dynamic';

const GRAD: Record<string, string> = {
  apartment: 'linear-gradient(135deg,#1A2A6C,#46688A)',
  villa: 'linear-gradient(135deg,#134E5E,#71B280)',
  plot: 'linear-gradient(135deg,#373B44,#4286f4)',
  office_space: 'linear-gradient(135deg,#16331F,#2A7A4A)',
  pub_bar_fnb: 'linear-gradient(135deg,#3A1C71,#D76D77)',
  commercial: 'linear-gradient(135deg,#4B0082,#8B008B)',
  residential: 'linear-gradient(135deg,#0B6B3A,#06472A)',
};

const label = (s?: string) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!isSupabaseConfigured()) return { title: 'Listing — Brokly' };
  const db = supabaseAdmin();
  const { data: l } = await db.from('properties').select('title, headline, description, cover_url, location').eq('slug', slug).maybeSingle();
  if (!l) return { title: 'Listing — Brokly' };
  const base = process.env.NEXT_PUBLIC_APP_URL || '';
  const loc = [l.location?.area, l.location?.city].filter(Boolean).join(', ');
  const title = `${l.title}${loc ? ' · ' + loc : ''}`;
  const description = l.headline || l.description || 'Property on Brokly';
  const image = l.cover_url || `${base}/icons/icon-512.png`;
  return {
    metadataBase: base ? new URL(base) : undefined,
    title,
    description,
    openGraph: { title, description, type: 'website', siteName: 'Brokly', images: [{ url: image }] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="tiny muted">{k}</div>
      <div style={{ fontWeight: 700 }}>{v}</div>
    </div>
  );
}

export default async function ListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSupabaseConfigured()) notFound();
  const db = supabaseAdmin();
  const { data: l } = await db.from('properties').select('*, brokers(name,phone)').eq('slug', slug).maybeSingle();
  if (!l) notFound();
  db.from('properties').update({ views: (l.views || 0) + 1 }).eq('id', l.id).then(() => {});

  const media: { type: string; url: string }[] = Array.isArray(l.media) ? l.media : [];
  const images = media.filter((m) => m.type === 'image');
  const cover = l.cover_url || images[0]?.url;
  const grad = GRAD[l.subtype] || GRAD[l.category] || GRAD.residential;
  const loc = l.location || {};
  const broker = l.brokers as { name?: string; phone?: string } | null;
  const pricing: PricingOption[] = l.pricing_options || [];

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', paddingBottom: 96 }}>
      {/* hero */}
      <div style={{ position: 'relative', height: 280, background: grad, overflow: 'hidden' }}>
        {cover && <img src={cover} alt={l.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.6), transparent 55%)' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className="tagline" style={{ background: 'rgba(255,255,255,.92)', color: 'var(--brandD)' }}>{label(l.transaction_type)}</span>
            {l.status !== 'published' && <span className="tagline" style={{ background: 'var(--gold)', color: '#fff' }}>{label(l.status)}</span>}
          </div>
          <h1 className="bric" style={{ marginTop: 8, fontSize: 26, fontWeight: 800, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,.4)' }}>{l.title}</h1>
        </div>
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* gallery */}
        {images.length > 1 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {images.slice(cover === images[0]?.url ? 1 : 0).map((m, i) => (
              <img key={i} src={m.url} alt="" style={{ height: 150, width: 220, flexShrink: 0, borderRadius: 14, objectFit: 'cover' }} />
            ))}
          </div>
        )}

        {/* pricing */}
        <section className="card" style={{ padding: 18 }}>
          {pricing.length ? pricing.map((p, i) => (
            <div key={i} style={i ? { marginTop: 16, borderTop: '1px solid var(--line)', paddingTop: 16 } : undefined}>
              <div className="tiny" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--ink2)' }}>{label(p.option)}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '4px 16px', marginTop: 4 }}>
                {p.price_inr != null && <div className="bric tnum" style={{ fontSize: 26, fontWeight: 800, color: 'var(--brand)' }}>{inrFull(p.price_inr)}</div>}
                {p.monthly_inr != null && <div className="bric tnum" style={{ fontSize: 26, fontWeight: 800, color: 'var(--brand)' }}>{inrFull(p.monthly_inr)}<span className="sm muted" style={{ fontWeight: 600 }}>/mo</span></div>}
                {p.negotiable && p.negotiable !== 'unknown' && <span className="pill" style={{ background: 'var(--surface2)', color: 'var(--ink2)' }}>{p.negotiable === 'slight' ? 'Slightly negotiable' : p.negotiable === 'yes' ? 'Negotiable' : 'Fixed price'}</span>}
              </div>
              <div className="sm muted" style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 20px', marginTop: 8 }}>
                {p.floor_rent_monthly_inr != null && <span>Floor rent: <b>{inrShort(p.floor_rent_monthly_inr)}/mo</b></span>}
                {p.deposit_inr != null && <span>Deposit: <b>{inrShort(p.deposit_inr)}</b></span>}
                {p.security_deposit_inr != null && <span>Security: <b>{inrShort(p.security_deposit_inr)}</b></span>}
              </div>
              {p.includes?.length ? <div className="sm muted" style={{ marginTop: 8 }}>Includes: {p.includes.join(', ')}</div> : null}
            </div>
          )) : <div className="muted">Price on request</div>}
        </section>

        {/* key facts */}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))' }}>
          {l.area_sqft ? <Fact k="Area" v={`${l.area_sqft.toLocaleString('en-IN')} sqft`} /> : null}
          {l.floor ? <Fact k="Floor" v={l.floor} /> : null}
          {l.bedrooms != null ? <Fact k="Bedrooms" v={String(l.bedrooms)} /> : null}
          {l.furnishing ? <Fact k="Furnishing" v={label(l.furnishing)} /> : null}
          {(l.capacity || []).map((c: { metric: string; value: number }) => <Fact key={c.metric} k={label(c.metric)} v={String(c.value)} />)}
          {(l.layout || []).map((c: { item: string; count: number }) => <Fact key={c.item} k={label(c.item)} v={String(c.count)} />)}
        </div>

        {l.highlights?.length ? (
          <section className="card" style={{ padding: 18 }}>
            <h2 className="tiny" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--ink2)' }}>Highlights</h2>
            <ul style={{ marginTop: 10, display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', listStyle: 'none' }}>
              {l.highlights.map((h: string, i: number) => (
                <li key={i} className="sm" style={{ display: 'flex', gap: 8 }}><span style={{ color: 'var(--brand)' }}>✓</span>{h}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {l.description ? (
          <section className="card" style={{ padding: 18 }}>
            <h2 className="tiny" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--ink2)' }}>About this property</h2>
            <p style={{ marginTop: 8, lineHeight: 1.6 }}>{l.description}</p>
          </section>
        ) : null}

        {l.licenses?.length ? (
          <section className="card" style={{ padding: 18 }}>
            <h2 className="tiny" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--ink2)' }}>Licences</h2>
            {l.licenses.map((x: { type: string; fee_inr?: number; deposit_inr?: number }, i: number) => (
              <div key={i} className="sm" style={{ marginTop: 8 }}>
                <b>{x.type}</b>{x.fee_inr ? ` · fee ${inrShort(x.fee_inr)}` : ''}{x.deposit_inr ? ` · deposit ${inrShort(x.deposit_inr)}` : ''}
              </div>
            ))}
          </section>
        ) : null}

        {(loc.area || loc.city || loc.maps_url) ? (
          <section className="card" style={{ padding: 18 }}>
            <h2 className="tiny" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--ink2)' }}>Location</h2>
            <p style={{ marginTop: 4 }}>{[loc.area, loc.city].filter(Boolean).join(', ') || 'See map'}</p>
            {loc.maps_url && <a href={loc.maps_url} target="_blank" rel="noreferrer" className="sm" style={{ color: 'var(--blue)', fontWeight: 600 }}>Open in Google Maps →</a>}
          </section>
        ) : null}

        <p className="tiny muted" style={{ textAlign: 'center' }}>Listed by {broker?.name || 'a Brokly broker'} · powered by Brokly</p>
      </div>

      {/* sticky enquire */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, borderTop: '1px solid var(--line)', background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(12px)', padding: 12 }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <EnquireButton propertyId={l.id} brokerPhone={broker?.phone} title={l.title} slug={l.slug} />
        </div>
      </div>
    </main>
  );
}
