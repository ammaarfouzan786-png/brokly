'use client';

import { useState } from 'react';
import { useUI } from '../ui-context';
import { useStore } from '@/lib/store';
import type { Property, PropertyType } from '@/lib/types';
import { PropDetail } from '../PropDetail';
import { formatInr, formatInrShort, perSqft, parseRupees } from '@/lib/money';
import { cx } from '@/lib/util';

const AREAS = ['Whitefield', 'HSR Layout', 'Sarjapur', 'Hebbal', 'Indiranagar', 'Koramangala'];
const TYPES: PropertyType[] = ['Apartment', 'Villa', 'Plot', 'Commercial'];
const FACING = ['E', 'N', 'S', 'W', 'NE', 'SE'];

function PropCard({ p }: { p: Property }) {
  const { showModal, previewSingle, nav } = useUI();
  const makeSingleLink = useStore((s) => s.makeSingleLink);
  const toast = useStore((s) => s.toast);

  // Stable pseudo-values for media counts / facing (until real data exists).
  const h = [...p.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const photos = 5 + (h % 8);
  const videos = h % 2;
  const facing = FACING[h % FACING.length];
  const parks = p.bhk >= 4 ? 3 : p.bhk >= 3 ? 2 : 1;

  return (
    <div className="pcard" onClick={() => showModal(<PropDetail id={p.id} />)}>
      <div className="img" style={{ height: 160, background: p.gradient }}>
        <div className="imgbadges">
          <span className="pbadge live">● Live</span>
          {p.onMarket && <span className="pbadge cobroke">Co-broke</span>}
          {p.sold && <span className="pbadge" style={{ background: 'var(--ink)', color: '#fff' }}>Sold</span>}
        </div>
        <div className="imgcnt">
          <span>◎ {photos}</span>
          {videos > 0 && <span>▶ {videos}</span>}
        </div>
      </div>
      <div className="bd" style={{ padding: '13px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div className="price bric tnum" style={{ fontSize: 21 }}>{formatInrShort(p.price)}</div>
          <span className="chip" style={{ background: 'var(--goldSoft)', color: 'var(--gold)', border: 'none', fontSize: 11, padding: '4px 9px' }}>✦ AI: priced right</span>
        </div>
        <div className="persq tnum">{formatInr(perSqft(p.price, p.sqft))}/sqft · negotiable</div>
        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 7 }}>{p.title}, {p.area}</div>
        <div className="spec">
          <span>◧ {p.sqft.toLocaleString('en-IN')} sqft</span>
          {p.bhk > 0 && <span>⌂ {p.bhk} Bed</span>}
          <span>⊞ {parks} Park</span>
          <span>✦ {facing}-facing</span>
        </div>
        <div className="pfoot">
          <button
            className="btn ghost sm"
            onClick={(e) => {
              e.stopPropagation();
              previewSingle(p.id);
            }}
          >
            Share card
          </button>
          <button
            className="btn brand sm"
            onClick={(e) => {
              e.stopPropagation();
              makeSingleLink(p.id);
              nav('marketing');
              toast('Opening Marketing studio for this listing…');
            }}
          >
            Market
          </button>
        </div>
      </div>
    </div>
  );
}

function AddProperty({ onClose }: { onClose: () => void }) {
  const addProperty = useStore((s) => s.addProperty);
  const toast = useStore((s) => s.toast);
  const [f, setF] = useState({ title: '', area: AREAS[0], type: TYPES[0] as PropertyType, bhk: '3', price: '', sqft: '' });

  function save() {
    if (!f.title.trim()) return toast('Add a title');
    addProperty({
      title: f.title.trim(),
      type: f.type,
      area: f.area,
      bhk: Number(f.bhk),
      sqft: Number(f.sqft) || 0,
      price: parseRupees(f.price),
    });
    toast('Property added ✓');
    onClose();
  }

  return (
    <div className="card" style={{ padding: 16, marginTop: 14 }}>
      <b>New property</b>
      <div className="row2">
        <div>
          <label className="field">Title</label>
          <input className="in" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="3BHK, Prestige Lakeside" />
        </div>
        <div>
          <label className="field">Area</label>
          <select className="in" value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })}>
            {AREAS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
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
          <label className="field">Config (BHK)</label>
          <select className="in" value={f.bhk} onChange={(e) => setF({ ...f, bhk: e.target.value })}>
            <option value="2">2 BHK</option>
            <option value="3">3 BHK</option>
            <option value="4">4 BHK</option>
            <option value="0">NA</option>
          </select>
        </div>
      </div>
      <div className="row2">
        <div>
          <label className="field">Sale price (₹)</label>
          <input className="in tnum" inputMode="numeric" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} placeholder="14500000" />
        </div>
        <div>
          <label className="field">Sq ft</label>
          <input className="in tnum" inputMode="numeric" value={f.sqft} onChange={(e) => setF({ ...f, sqft: e.target.value })} placeholder="1575" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn brand" onClick={save}>Save property</button>
      </div>
    </div>
  );
}

export function Stock() {
  const properties = useStore((s) => s.properties);
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const areas = Array.from(new Set(properties.map((p) => p.area)));
  const cobrokeCount = properties.filter((p) => p.onMarket).length;
  const filtered =
    filter === 'all' ? properties : filter === '__cobroke' ? properties.filter((p) => p.onMarket) : properties.filter((p) => p.area === filter);

  return (
    <section className="screen">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="h1">My stock</div>
          <div className="sub">{properties.length} active listings</div>
        </div>
        <button className="btn brand" onClick={() => setAdding((a) => !a)}>+ Add property</button>
      </div>

      {adding && <AddProperty onClose={() => setAdding(false)} />}

      <div style={{ display: 'flex', gap: 7, overflowX: 'auto', margin: '16px 0 4px', paddingBottom: 2 }}>
        <button className={cx('chip', filter === 'all' && 'active')} onClick={() => setFilter('all')}>All {properties.length}</button>
        {areas.map((a) => (
          <button key={a} className={cx('chip', filter === a && 'active')} onClick={() => setFilter(a)}>{a}</button>
        ))}
        {cobrokeCount > 0 && (
          <button className={cx('chip', filter === '__cobroke' && 'active')} style={filter === '__cobroke' ? undefined : { color: 'var(--money)' }} onClick={() => setFilter('__cobroke')}>
            Co-broked {cobrokeCount}
          </button>
        )}
      </div>

      <div className="plist" style={{ marginTop: 12 }}>
        {filtered.map((p) => (
          <PropCard key={p.id} p={p} />
        ))}
        {filtered.length === 0 && <div className="empty">No listings in this filter.</div>}
      </div>
    </section>
  );
}
