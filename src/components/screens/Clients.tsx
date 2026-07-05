'use client';

import { useEffect, useRef, useState } from 'react';
import { useUI } from '../ui-context';
import { useStore } from '@/lib/store';
import type { PropertyType, Urgency } from '@/lib/types';
import { rankProperties, STRONG_FIT } from '@/lib/matching';
import { PropDetail } from '../PropDetail';
import { formatInrShort, parseRupees, rupees } from '@/lib/money';

const AREAS = ['Whitefield', 'HSR Layout', 'Sarjapur', 'Hebbal', 'Indiranagar', 'Koramangala'];
const TYPES: PropertyType[] = ['Apartment', 'Villa', 'Plot', 'Commercial'];
const URG: Urgency[] = ['Urgent', 'This month', 'Browsing'];

// An empty budget form saves as 0 → ₹99.99 Cr; show that honestly as "any
// budget" instead of a misleading "₹0–₹100 Cr".
const OPEN_MAX = rupees(900000000);
function budgetLabel(min: number, max: number): string {
  if (!min && max >= OPEN_MAX) return 'any budget';
  return `${formatInrShort(min)}–${formatInrShort(max)}`;
}

function MatchResult() {
  const clientId = useStore((s) => s.lastMatchClientId);
  const client = useStore((s) => s.clients.find((c) => c.id === clientId));
  const properties = useStore((s) => s.properties);
  const makeCollectionLink = useStore((s) => s.makeCollectionLink);
  const toast = useStore((s) => s.toast);
  const { showModal, nav } = useUI();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  }, [clientId]);

  if (!client) return null;
  const ranked = rankProperties(properties, client);
  const good = ranked.filter((m) => m.score >= STRONG_FIT).length;

  return (
    <div ref={ref}>
      <div className="sectionh">Matches for {client.name}</div>
      <div className="sub" style={{ marginBottom: 10 }}>
        {client.type} · {client.bhk ? client.bhk + 'BHK' : 'any'} · {client.area} · {budgetLabel(client.min, client.max)} — {good} strong fits ranked below
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))' }}>
        {ranked.map((m) => {
          const c = m.score >= 75 ? 'var(--money)' : m.score >= STRONG_FIT ? 'var(--gold)' : 'var(--ink3)';
          return (
            <div className="pcard" key={m.p.id} onClick={() => showModal(<PropDetail id={m.p.id} />)}>
              <div className="img" style={{ background: m.p.gradient }}>
                <div className="b1">
                  <span className="tagline" style={{ background: c, color: '#fff' }}>
                    {m.score}% match
                  </span>
                </div>
              </div>
              <div className="bd">
                <div className="price bric tnum">{formatInrShort(m.p.price)}</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 4 }}>{m.p.title}</div>
                <div className="spec">
                  <span>📍 {m.p.area}</span>
                  <span>{m.p.bhk ? m.p.bhk + ' BHK' : m.p.type}</span>
                </div>
                <div className="matchbar" style={{ marginTop: 10 }}>
                  <i style={{ width: `${m.score}%`, background: c }} />
                </div>
                <div style={{ marginTop: 8 }}>
                  {m.reasons.length ? (
                    m.reasons.map((x, i) => (
                      <span className="reason" key={i}>
                        ✓ {x}
                      </span>
                    ))
                  ) : (
                    <span className="tiny muted">Weak fit</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="card" style={{ padding: 16, marginTop: 14, background: 'var(--brandSoft)', borderColor: '#CFE7DA' }}>
        <b>Turn the top matches into a link for this client</b>
        <div className="sm muted" style={{ margin: '6px 0 12px' }}>
          A <b>smart collection</b> link auto-adds future stock that fits this brief.
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className="btn gold"
            onClick={() => {
              const l = makeCollectionLink();
              if (l) {
                toast('Smart collection link created ✓');
                nav('links');
              } else {
                toast('Run a match first');
              }
            }}
          >
            Create smart collection link
          </button>
          <button className="btn" onClick={() => nav('links')}>
            Go to Links
          </button>
        </div>
      </div>
    </div>
  );
}

export function Clients() {
  const clients = useStore((s) => s.clients);
  const runMatch = useStore((s) => s.runMatch);
  const rematch = useStore((s) => s.rematch);
  const toast = useStore((s) => s.toast);
  const lastMatchClientId = useStore((s) => s.lastMatchClientId);

  const [f, setF] = useState({
    name: '', phone: '', type: TYPES[0] as PropertyType, bhk: '3',
    area: AREAS[0], urg: URG[0] as Urgency, min: '', max: '',
  });

  function submit() {
    if (!f.name.trim()) return toast('Add the client name');
    runMatch({
      name: f.name.trim(),
      phone: f.phone,
      type: f.type,
      bhk: Number(f.bhk),
      area: f.area,
      urg: f.urg,
      min: parseRupees(f.min),
      max: f.max ? parseRupees(f.max) : rupees(999999999),
    });
    // strong-fit count for the toast is derived after the client is created
    const props = useStore.getState().properties;
    const created = useStore.getState().clients[0];
    const good = rankProperties(props, created).filter((m) => m.score >= STRONG_FIT).length;
    toast('AI matched ' + good + ' properties');
  }

  return (
    <section className="screen">
      <div className="h1">Clients &amp; AI matching</div>
      <div className="sub">A client tells you what they want — Brokly ranks your stock and builds them a link.</div>

      <div className="card" style={{ padding: 16, marginTop: 16 }}>
        <b>New client requirement</b>
        <div className="row2">
          <div>
            <label className="field">Client name</label>
            <input className="in" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Rajesh Iyer" />
          </div>
          <div>
            <label className="field">WhatsApp / phone</label>
            <input className="in" inputMode="numeric" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="9198xxxxxxx" />
          </div>
        </div>
        <div className="row2">
          <div>
            <label className="field">Type</label>
            <select className="in" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as PropertyType })}>
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field">Config</label>
            <select className="in" value={f.bhk} onChange={(e) => setF({ ...f, bhk: e.target.value })}>
              <option value="2">2 BHK</option>
              <option value="3">3 BHK</option>
              <option value="4">4 BHK</option>
              <option value="0">Any</option>
            </select>
          </div>
        </div>
        <div className="row2">
          <div>
            <label className="field">Preferred area</label>
            <select className="in" value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })}>
              {AREAS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field">Urgency</label>
            <select className="in" value={f.urg} onChange={(e) => setF({ ...f, urg: e.target.value as Urgency })}>
              {URG.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="row2">
          <div>
            <label className="field">Budget min (₹)</label>
            <input className="in tnum" inputMode="numeric" value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} placeholder="16000000" />
          </div>
          <div>
            <label className="field">Budget max (₹)</label>
            <input className="in tnum" inputMode="numeric" value={f.max} onChange={(e) => setF({ ...f, max: e.target.value })} placeholder="19000000" />
          </div>
        </div>
        <button className="btn ai full" style={{ marginTop: 16 }} onClick={submit}>
          ✦ Save client &amp; run AI match
        </button>
      </div>

      {lastMatchClientId && <MatchResult />}

      <div className="sectionh">Saved clients</div>
      <div className="card">
        {clients.length ? (
          clients.map((c) => (
            <div className="linkrow" key={c.id}>
              <div className="linkico" style={{ background: 'var(--aiSoft)', color: 'var(--ai)' }}>
                {c.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <b>{c.name}</b>
                <div className="sm muted">
                  {c.type} · {c.bhk ? c.bhk + 'BHK' : 'any'} · {c.area} · {budgetLabel(c.min, c.max)} · {c.urg}
                </div>
              </div>
              <button className="btn sm" onClick={() => rematch(c.id)}>
                Re-match
              </button>
            </div>
          ))
        ) : (
          <div className="empty">No clients yet.</div>
        )}
      </div>
    </section>
  );
}
