'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { SEED_PULSE, PULSE_TABS, type PulseItem, type PulseTab } from '@/lib/pulse';
import { cx } from '@/lib/util';

export function Pulse() {
  const properties = useStore((s) => s.properties);
  const toast = useStore((s) => s.toast);
  const [items, setItems] = useState<PulseItem[]>(SEED_PULSE);
  const [tab, setTab] = useState<PulseTab>('All');
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);

  async function refresh() {
    setBusy(true);
    try {
      const areas = Array.from(new Set(properties.map((p) => p.area)));
      const res = await fetch('/api/pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: 'Bengaluru', areas }),
      });
      const data = await res.json();
      if (Array.isArray(data.items) && data.items.length) {
        setItems(data.items);
        setLive(data.source === 'ai');
        toast(data.source === 'ai' ? 'Pulse refreshed ✦' : 'Refreshed (demo feed — add GEMINI_API_KEY for live AI)');
      }
    } catch {
      toast('Could not refresh');
    }
    setBusy(false);
  }

  const list = tab === 'All' ? items : items.filter((p) => p.tab === tab);

  return (
    <section className="screen">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <div className="h1">Pulse</div>
          <div className="sub" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: live ? 'var(--brand)' : 'var(--ink3)' }} />
            {live ? 'Live AI market intelligence' : "What's moving your market today"}
          </div>
        </div>
        <button className="btn ai" onClick={refresh} disabled={busy}>{busy ? 'Refreshing…' : '✦ Refresh (AI)'}</button>
      </div>

      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', margin: '16px 0' }}>
        {PULSE_TABS.map((t) => (
          <button key={t} className={cx('chip', tab === t && 'active')} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      <div className="stagger">
        {list.map((p, i) => (
          <div
            key={i}
            className="card"
            style={{ padding: '16px 18px', marginBottom: 11, cursor: 'pointer' }}
            onClick={() => toast('Opening: ' + p.act)}
          >
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.6px', marginBottom: 7, color: p.color }}>{p.label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35, marginBottom: 5 }}>{p.title}</div>
            <div className="sm muted" style={{ lineHeight: 1.55 }}>{p.body}</div>
            <button className="btn sm" style={{ marginTop: 11 }} onClick={(e) => { e.stopPropagation(); toast('Opening: ' + p.act); }}>{p.act} →</button>
          </div>
        ))}
        {list.length === 0 && <div className="empty">Nothing in this view right now.</div>}
      </div>
    </section>
  );
}
