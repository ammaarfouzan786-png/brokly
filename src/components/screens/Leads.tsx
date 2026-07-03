'use client';

import { useStore, type LeadFilter } from '@/lib/store';
import { cx, digits } from '@/lib/util';

const FILTERS: { f: LeadFilter; label: string }[] = [
  { f: 'all', label: 'All' },
  { f: 'HOT', label: '🔥 Hot' },
  { f: 'WARM', label: 'Warm' },
];

export function Leads() {
  const leads = useStore((s) => s.leads);
  const properties = useStore((s) => s.properties);
  const leadFilter = useStore((s) => s.leadFilter);
  const setLeadFilter = useStore((s) => s.setLeadFilter);

  const list = leads.filter((l) => leadFilter === 'all' || l.temp === leadFilter);

  return (
    <section className="screen">
      <div className="h1">Leads</div>
      <div className="sub">Enquiries from your links — scored by AI, tied to the property.</div>

      <div style={{ display: 'flex', gap: 8, margin: '14px 0' }}>
        {FILTERS.map((x) => (
          <button key={x.f} className={cx('btn sm', leadFilter === x.f && 'ink')} onClick={() => setLeadFilter(x.f)}>
            {x.label}
          </button>
        ))}
      </div>

      <div className="card">
        {list.length ? (
          list.map((d) => {
            const p = properties.find((x) => x.id === d.propId);
            const col =
              d.temp === 'HOT'
                ? ['var(--hotSoft)', 'var(--hot)']
                : d.temp === 'WARM'
                  ? ['var(--goldSoft)', 'var(--gold)']
                  : ['var(--line)', 'var(--ink2)'];
            const iconBg = d.temp === 'HOT' ? 'var(--hot)' : d.temp === 'WARM' ? 'var(--gold)' : 'var(--ink3)';
            return (
              <div className="linkrow" key={d.id}>
                <div className="linkico" style={{ background: iconBg, color: '#fff' }}>
                  {d.name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="tagline" style={{ background: col[0], color: col[1] }}>
                      {d.temp}
                    </span>
                    <b>{d.name}</b>
                    <span className="pill" style={{ background: 'var(--aiSoft)', color: 'var(--ai)' }}>
                      ✦ AI {d.score}
                    </span>
                  </div>
                  <div className="sm muted" style={{ marginTop: 3 }}>
                    {d.msg}
                  </div>
                  <div className="tiny muted" style={{ marginTop: 2 }}>
                    ↳ {p ? p.title : 'property'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <a className="btn sm" href={`tel:${d.phone}`}>
                    Call
                  </a>
                  <a className="btn sm wa" href={`https://wa.me/${digits(d.phone || '')}`} target="_blank" rel="noreferrer">
                    WA
                  </a>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty">No leads in this view. Open a link as a buyer and enquire.</div>
        )}
      </div>
    </section>
  );
}
