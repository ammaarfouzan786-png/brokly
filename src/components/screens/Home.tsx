'use client';

import { useState } from 'react';
import { useUI } from '../ui-context';
import { useStore, type Screen } from '@/lib/store';
import { activeBroker } from '@/lib/broker';
import { cx } from '@/lib/util';

interface Visit { time: string; buyer: string; prop: string; phone: string }
const VISITS: Visit[] = [
  { time: '11:00 AM', buyer: 'Priya Menon', prop: '3BHK · Prestige Lakeside, Whitefield', phone: '919845567890' },
  { time: '4:30 PM', buyer: 'Vikram Desai', prop: '4BHK · Sobha Dream, Sarjapur', phone: '919812345678' },
];

const TEAM = [
  { id: 't1', name: 'Rahul S.', init: 'RS', color: '#2E72D2' },
  { id: 't2', name: 'Sneha P.', init: 'SP', color: '#0B6B3A' },
  { id: 't3', name: 'Kiran K.', init: 'KK', color: '#7C3AED' },
];

export function Home() {
  const { nav, openAssistant } = useUI();
  const leads = useStore((s) => s.leads);
  const clients = useStore((s) => s.clients);
  const links = useStore((s) => s.links);
  const conversations = useStore((s) => s.conversations);
  const cobrokeMarket = useStore((s) => s.cobrokeMarket);
  const toast = useStore((s) => s.toast);

  const hot = leads.filter((l) => l.temp === 'HOT');
  const unread = conversations.reduce((a, c) => a + c.unread, 0);
  const unmatched = clients.filter((c) => !links.some((l) => l.kind === 'collection' && l.clientId === c.id));
  const broker = activeBroker();
  const firstName = broker.name.split(' ')[0];

  // ---- daily tasks ----
  const tasks: { id: string; label: string; screen?: Screen }[] = [
    hot[0] && { id: 'call', label: `Call ${hot[0].name} — hot lead (AI ${hot[0].score})`, screen: 'leads' as Screen },
    unread > 0 && { id: 'reply', label: `Reply to ${unread} unread WhatsApp chat${unread > 1 ? 's' : ''}`, screen: 'inbox' as Screen },
    VISITS[0] && { id: 'visit', label: `Confirm ${VISITS[0].time} site visit with ${VISITS[0].buyer}` },
    unmatched[0] && { id: 'match', label: `Match ${unmatched[0].name}'s brief → build a link`, screen: 'clients' as Screen },
    { id: 'market', label: 'Generate marketing for Prestige Lakeside', screen: 'marketing' as Screen },
  ].filter(Boolean) as { id: string; label: string; screen?: Screen }[];

  const [done, setDone] = useState<Record<string, boolean>>({});
  const doneCount = tasks.filter((t) => done[t.id]).length;

  // ---- hot takes ----
  const bestSplit = cobrokeMarket.length ? Math.max(...cobrokeMarket.map((m) => m.split)) : 0;
  const takes = [
    { icon: '🔥', color: 'var(--hot)', text: `${hot.length || 'No'} hot lead${hot.length === 1 ? '' : 's'} waiting${hot[0] ? ` — ${hot[0].name} hasn't been called yet` : ''}.` },
    { icon: '📈', color: 'var(--brand)', text: 'Whitefield demand is up 38% this month — push your Whitefield stock today.' },
    { icon: '🤝', color: 'var(--ai)', text: `${cobrokeMarket.length} co-broke listings open near you${bestSplit ? ` — best split ${bestSplit}%` : ''}.` },
  ];

  // ---- team marketing tokens ----
  const [pool, setPool] = useState(50);
  const [assigned, setAssigned] = useState<Record<string, number>>({ t1: 10, t2: 6, t3: 0 });
  function assign(id: string) {
    if (pool <= 0) return toast('No tokens left — top up to assign more');
    setPool((p) => p - 5);
    setAssigned((a) => ({ ...a, [id]: (a[id] || 0) + 5 }));
    toast(`+5 marketing tokens → ${TEAM.find((t) => t.id === id)?.name}`);
  }

  return (
    <section className="screen">
      <div className="h1">Hello, {firstName}</div>
      <div className="sub">{broker.area} · {broker.city} · here&apos;s your day</div>

      {/* Hot takes */}
      <div className="sectionh">🔥 Hot takes for today</div>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
        {takes.map((t, i) => (
          <div key={i} className="card" style={{ padding: 16, minWidth: 260, flex: '0 0 auto', borderLeft: `3px solid ${t.color}` }}>
            <div style={{ fontSize: 22 }}>{t.icon}</div>
            <div className="sm" style={{ marginTop: 8, lineHeight: 1.5 }}>{t.text}</div>
          </div>
        ))}
      </div>

      {/* Daily tasks */}
      <div className="sectionh">
        Today&apos;s tasks <span className="tiny muted">{doneCount}/{tasks.length} done</span>
      </div>
      <div className="card">
        {tasks.map((t) => (
          <div key={t.id} className="linkrow" style={{ gap: 12 }}>
            <button
              onClick={() => setDone((d) => ({ ...d, [t.id]: !d[t.id] }))}
              style={{ width: 24, height: 24, borderRadius: 7, border: `2px solid ${done[t.id] ? 'var(--brand)' : 'var(--border2)'}`, background: done[t.id] ? 'var(--brand)' : 'transparent', color: '#fff', flex: 'none', fontSize: 13 }}
            >
              {done[t.id] ? '✓' : ''}
            </button>
            <div style={{ flex: 1, textDecoration: done[t.id] ? 'line-through' : 'none', color: done[t.id] ? 'var(--ink3)' : 'var(--ink)' }}>{t.label}</div>
            {t.screen && (
              <button className="btn sm" onClick={() => nav(t.screen!)}>Open</button>
            )}
          </div>
        ))}
      </div>

      {/* Site visits today */}
      <div className="sectionh">📅 Site visits today <span className="tiny muted">{VISITS.length} scheduled</span></div>
      <div className="card">
        {VISITS.map((v, i) => (
          <div key={i} className="linkrow">
            <div className="linkico" style={{ background: 'var(--brandSoft)', color: 'var(--brand)', flexDirection: 'column', fontSize: 11, lineHeight: 1.1 }}>
              <div style={{ fontWeight: 800 }}>{v.time.split(' ')[0]}</div>
              <div style={{ fontSize: 9 }}>{v.time.split(' ')[1]}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b>{v.buyer}</b>
              <div className="sm muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.prop}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <a className="btn sm wa" href={`https://wa.me/${v.phone}`} target="_blank" rel="noreferrer">WA</a>
              <button className="btn sm brand" onClick={() => toast('Visit confirmed ✓')}>Confirm</button>
            </div>
          </div>
        ))}
      </div>

      {/* AI chat */}
      <div className="sectionh">✦ Ask Brokly AI</div>
      <div className="brief" onClick={openAssistant} style={{ cursor: 'pointer' }}>
        <div className="e">✦ Your AI, on your live data</div>
        <h3 style={{ marginBottom: 8 }}>Which leads are hot? Draft a WhatsApp. Stamp duty on 1.5cr?</h3>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {['Which leads are hot?', 'Draft a WhatsApp', 'Match Rajesh'].map((q) => (
            <button key={q} className="btn sm" style={{ background: 'rgba(255,255,255,.16)', border: 'none', color: '#fff' }} onClick={(e) => { e.stopPropagation(); openAssistant(); }}>{q}</button>
          ))}
        </div>
      </div>

      {/* Team marketing tokens */}
      <div className="sectionh">
        🎟️ Team marketing tokens <span className="tiny muted">{pool} in pool</span>
      </div>
      <div className="card">
        <div className="linkrow" style={{ background: 'var(--surface2)' }}>
          <div className="sm muted" style={{ flex: 1 }}>Assign tokens so your team can generate AI marketing.</div>
          <span className="pill" style={{ background: 'var(--goldSoft)', color: 'var(--gold)' }}>{pool} left</span>
        </div>
        {TEAM.map((m) => (
          <div key={m.id} className="linkrow">
            <div className="avatar" style={{ background: m.color }}>{m.init}</div>
            <div style={{ flex: 1 }}>
              <b>{m.name}</b>
              <div className="sm muted">{assigned[m.id] || 0} tokens</div>
            </div>
            <button className={cx('btn sm', pool > 0 && 'brand')} disabled={pool <= 0} onClick={() => assign(m.id)}>+5 tokens</button>
          </div>
        ))}
      </div>

      {/* Full flow shortcut */}
      <div className="sectionh">Jump to</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {([['stock', '🏠 Stock'], ['inbox', '📥 Inbox'], ['clients', '✦ Match'], ['money', '₹ Money'], ['marketing', '🎨 Marketing'], ['pulse', '≋ Pulse']] as [Screen, string][]).map(([s, label]) => (
          <button key={s} className="chip" onClick={() => nav(s)}>{label}</button>
        ))}
      </div>
    </section>
  );
}
