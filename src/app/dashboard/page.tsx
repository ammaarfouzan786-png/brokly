import Link from 'next/link';
import { isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase';
import { priceHeadline, type PricingOption } from '@/lib/listing-format';
import { LeadsLive } from './LeadsLive';

export const dynamic = 'force-dynamic';

interface Listing {
  id: string;
  slug: string;
  title: string;
  cover_url: string | null;
  views: number;
  pricing_options: PricingOption[];
  location?: { area?: string | null; city?: string | null };
}

export default async function Dashboard() {
  const configured = isSupabaseConfigured();
  let leads: Parameters<typeof LeadsLive>[0]['initial'] = [];
  let listings: Listing[] = [];

  if (configured) {
    const db = supabaseAdmin();
    const [{ data: ld }, { data: ls }] = await Promise.all([
      db.from('leads').select('*, properties(title,slug)').order('last_msg_at', { ascending: false }).limit(50),
      db.from('properties').select('*').order('created_at', { ascending: false }).limit(50),
    ]);
    leads = ld || [];
    listings = (ls || []) as Listing[];
  }

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 16px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="logo">b</div>
            <div>
              <div className="bric" style={{ fontSize: 24, fontWeight: 800 }}>Dashboard</div>
              <div className="sub">Your listings and live buyer leads</div>
            </div>
          </div>
        </div>
        <Link href="/new" className="btn brand">+ Create listing</Link>
      </div>

      {!configured && (
        <div className="card" style={{ padding: 18, marginTop: 18, background: 'var(--goldSoft)', borderColor: '#EAD9AE' }}>
          <b style={{ color: 'var(--gold)' }}>⚙️ Connect Supabase to go live</b>
          <div className="sm" style={{ marginTop: 6, lineHeight: 1.5 }}>
            Add <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> and{' '}
            <code>SUPABASE_SERVICE_ROLE_KEY</code> to <code>.env.local</code>, then run{' '}
            <code>supabase/schema.sql</code>. Full steps in <b>SUPABASE_SETUP.md</b>. The WhatsApp bot and listings
            need this; the rest of the app runs without it.
          </div>
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,1fr)', gap: 24, marginTop: 22, alignItems: 'start' }}>
        <section>
          <div className="sectionh">Live leads</div>
          <LeadsLive initial={leads} />
        </section>

        <section>
          <div className="sectionh">My listings <span className="tiny muted">{listings.length}</span></div>
          {listings.length ? (
            <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
              {listings.map((p) => (
                <Link key={p.id} href={`/listing/${p.slug}`} className="linkrow card" style={{ padding: 12, textDecoration: 'none' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: p.cover_url ? `center/cover url(${p.cover_url})` : 'linear-gradient(135deg,#0B6B3A,#06472A)', flex: 'none' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</b>
                    <div className="sm muted">{priceHeadline(p.pricing_options)}{p.location?.area ? ` · ${p.location.area}` : ''}</div>
                    <div className="tiny muted" style={{ marginTop: 2 }}>👁 {p.views || 0} views</div>
                  </div>
                  <span className="muted">›</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty">No listings yet. <Link href="/new" style={{ color: 'var(--brand)', fontWeight: 600 }}>Create one</Link> or forward a property to the WhatsApp bot.</div>
          )}
        </section>
      </div>
    </main>
  );
}
