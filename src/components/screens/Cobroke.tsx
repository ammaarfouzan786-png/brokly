'use client';

import { useState } from 'react';
import { useUI } from '../ui-context';
import { useStore } from '@/lib/store';
import type { CobrokeListing } from '@/lib/types';
import { formatInrShort } from '@/lib/money';
import { cx } from '@/lib/util';
import { CobrokeDeck } from '../CobrokeDeck';

function Agreement({ id }: { id: string }) {
  const m = useStore((s) => s.cobrokeMarket.find((x) => x.id === id));
  const acceptCobroke = useStore((s) => s.acceptCobroke);
  const toast = useStore((s) => s.toast);
  const { closeModal, nav } = useUI();
  if (!m) return null;

  return (
    <div style={{ padding: 22 }}>
      <div style={{ fontSize: 18, fontWeight: 700 }}>Co-broke agreement</div>
      <div className="sm muted" style={{ marginTop: 3 }}>
        Standardised split agreement — protects both sides.
      </div>
      <div className="card" style={{ padding: 16, marginTop: 14, boxShadow: 'none', background: 'var(--surface2)' }}>
        <div className="inv-line">
          <span className="muted">Property</span>
          <b>{m.title}</b>
        </div>
        <div className="inv-line">
          <span className="muted">Listing broker</span>
          <b>
            {m.broker} · ★{m.score}
          </b>
        </div>
        <div className="inv-line">
          <span className="muted">Your commission split</span>
          <b>{m.split}%</b>
        </div>
        <div className="inv-line" style={{ border: 'none' }}>
          <span className="muted">Owner contact</span>
          <b>🔒 Out-of-band (protected)</b>
        </div>
      </div>
      <div className="card" style={{ padding: 13, marginTop: 12, background: 'var(--goldSoft)', borderColor: '#EAD9AE', boxShadow: 'none' }}>
        <div className="tiny" style={{ fontWeight: 700, color: 'var(--gold)' }}>
          ⚖️ COMMISSION PROTECTION
        </div>
        <div className="tiny" style={{ marginTop: 4, lineHeight: 1.5 }}>
          If your buyer transacts on this property, your {m.split}% is locked in by this agreement. The owner is never
          exposed to you directly, and you&apos;re never exposed to the owner.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        <button className="btn" onClick={closeModal}>
          Cancel
        </button>
        <button
          className="btn ai"
          style={{ flex: 1 }}
          onClick={() => {
            acceptCobroke(m.id);
            closeModal();
            toast('Co-broke accepted — chat opened with ' + m.broker);
            nav('cobroke');
          }}
        >
          Accept &amp; connect with {m.broker.split(' ')[0]}
        </button>
      </div>
    </div>
  );
}

function MarketCard({ m }: { m: CobrokeListing }) {
  const { showModal } = useUI();
  return (
    <div className="pcard" style={{ cursor: 'default' }}>
      <div className="img" style={{ background: m.gradient }}>
        <div className="b1">
          <span className="tagline" style={{ background: 'var(--ai)', color: '#fff' }}>
            Split {m.split}%
          </span>
        </div>
      </div>
      <div className="bd">
        <div className="price bric tnum">{m.price ? formatInrShort(m.price) : formatInrShort(m.rent || 0) + '/mo'}</div>
        <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 4 }}>{m.title}</div>
        <div className="spec">
          <span>📍 {m.area}</span>
          <span>{m.bhk ? m.bhk + ' BHK' : m.type}</span>
          <span>◧ {m.sqft} sqft</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <span className="brokerchip">
            <span className="brokerav">{m.broker[0]}</span>
            {m.broker} · ★{m.score}
          </span>
        </div>
        <div className="lock" style={{ marginTop: 10 }}>
          🔒 Owner hidden (OOB) — deal via broker
        </div>
        <button className="btn ai sm full" style={{ marginTop: 10 }} onClick={() => showModal(<Agreement id={m.id} />)}>
          Request to co-broke
        </button>
      </div>
    </div>
  );
}

export function Cobroke() {
  const cobrokeMarket = useStore((s) => s.cobrokeMarket);
  const myCobroke = useStore((s) => s.myCobroke);
  const { showModal } = useUI();
  const [tab, setTab] = useState<'swipe' | 'browse' | 'mine'>('swipe');

  const stats: { icon: string; n: React.ReactNode; l: string; bg: string; c: string }[] = [
    { icon: '🤝', n: cobrokeMarket.length, l: 'Open inventory', bg: 'var(--aiSoft)', c: 'var(--ai)' },
    { icon: '✅', n: myCobroke.length, l: 'My co-broke deals', bg: 'var(--moneySoft)', c: 'var(--money)' },
    { icon: '🔒', n: 'OOB', l: 'Owners protected', bg: 'var(--goldSoft)', c: 'var(--gold)' },
  ];

  return (
    <section className="screen">
      <div className="h1">Co-broking marketplace</div>
      <div className="sub">
        Inventory from other Brokly brokers. The owner stays <b>out-of-band</b> (hidden) — you deal through the listing
        broker, commission protected.
      </div>
      <div className="stats" style={{ marginTop: 14 }}>
        {stats.map((s) => (
          <div className="stat" key={s.l}>
            <div className="i" style={{ background: s.bg, color: s.c }}>
              {s.icon}
            </div>
            <div className="n bric tnum" style={{ fontSize: typeof s.n === 'string' ? 20 : 26 }}>
              {s.n}
            </div>
            <div className="l">{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 7, margin: '18px 0 4px', flexWrap: 'wrap' }}>
        <button className={cx('chip', tab === 'swipe' && 'active')} onClick={() => setTab('swipe')}>✨ AI Matches</button>
        <button className={cx('chip', tab === 'browse' && 'active')} onClick={() => setTab('browse')}>Browse all</button>
        <button className={cx('chip', tab === 'mine' && 'active')} onClick={() => setTab('mine')}>
          My deals{myCobroke.length ? ` · ${myCobroke.length}` : ''}
        </button>
      </div>

      {tab === 'swipe' && (
        <div style={{ marginTop: 14 }}>
          <div className="card" style={{ maxWidth: 380, margin: '0 auto 16px', padding: 14, display: 'flex', gap: 12, background: 'var(--aiSoft)', borderColor: '#DAD2FB', boxShadow: 'none' }}>
            <div style={{ fontSize: 24 }}>✨</div>
            <div>
              <div className="tiny" style={{ fontWeight: 800, color: 'var(--ai)', letterSpacing: '.5px' }}>SWIPE TO CO-BROKE</div>
              <div className="sm" style={{ marginTop: 2, lineHeight: 1.4 }}>
                {cobrokeMarket.length} properties from other brokers match your buyers. Swipe right to send a co-broke request, left to skip.
              </div>
            </div>
          </div>
          <CobrokeDeck onRequest={(m) => showModal(<Agreement id={m.id} />)} />
        </div>
      )}

      {tab === 'browse' && (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', marginTop: 14 }}>
          {cobrokeMarket.length ? cobrokeMarket.map((m) => <MarketCard key={m.id} m={m} />) : <div className="empty">No open inventory right now.</div>}
        </div>
      )}

      {tab === 'mine' && (
        <div className="card" style={{ marginTop: 14 }}>
          {myCobroke.length ? (
            myCobroke.map((d) => (
              <div className="linkrow" key={d.id}>
                <div className="linkico" style={{ background: 'var(--moneySoft)', color: 'var(--money)' }}>🤝</div>
                <div style={{ flex: 1 }}>
                  <b>{d.title}</b>
                  <div className="sm muted">With {d.broker} · split {d.split}% · {formatInrShort(d.price || d.rent || 0)}</div>
                </div>
                <span className="pill" style={{ background: 'var(--goldSoft)', color: 'var(--gold)' }}>{d.status}</span>
              </div>
            ))
          ) : (
            <div className="empty">No co-broke deals yet. Swipe right on a match to request one.</div>
          )}
        </div>
      )}
    </section>
  );
}
