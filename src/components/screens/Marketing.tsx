'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { TEMPLATES, CATEGORIES, type MktTemplate, type MktCategory } from '@/lib/marketing';
import { formatInrShort } from '@/lib/money';
import { copyText, cx } from '@/lib/util';

const CAT_COLOR: Record<MktCategory, [string, string]> = {
  'Listing & copy': ['var(--brandSoft)', 'var(--brand)'],
  'Ads & social': ['var(--aiSoft)', 'var(--ai)'],
  'Client comms': ['var(--waSoft)', 'var(--wa)'],
  Analysis: ['var(--goldSoft)', 'var(--gold)'],
  'AI media': ['var(--blueSoft)', 'var(--blue)'],
};

function Generator({ tpl, onBack }: { tpl: MktTemplate; onBack: () => void }) {
  const properties = useStore((s) => s.properties);
  const toast = useStore((s) => s.toast);
  const [vars, setVars] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<{ text: string; source: string } | null>(null);

  function prefill(id: string) {
    const p = properties.find((x) => x.id === id);
    if (!p) return;
    setVars((v) => ({
      ...v,
      type: `${p.bhk ? p.bhk + 'BHK ' : ''}${p.type}`,
      location: `${p.area}, Bengaluru`,
      price: formatInrShort(p.price),
      details: `${p.sqft} sqft · ${p.title}`,
      space: p.type,
    }));
  }

  async function generate() {
    setBusy(true);
    setOut(null);
    try {
      const res = await fetch('/api/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: tpl.id, vars }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'failed');
      setOut({ text: data.text, source: data.source });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Generation failed');
    }
    setBusy(false);
  }

  return (
    <div>
      <button className="btn sm" onClick={onBack} style={{ marginBottom: 14 }}>← All templates</button>
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="linkico" style={{ background: CAT_COLOR[tpl.category][0], color: CAT_COLOR[tpl.category][1] }}>{tpl.emoji}</div>
          <div>
            <b style={{ fontSize: 16 }}>{tpl.title}</b>
            <div className="sm muted">{tpl.desc}</div>
          </div>
        </div>

        {properties.length > 0 && !tpl.copyOnly && (
          <>
            <label className="field">Prefill from a listing</label>
            <select className="in" defaultValue="" onChange={(e) => e.target.value && prefill(e.target.value)}>
              <option value="">— optional —</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </>
        )}

        {tpl.fields.map((f) => (
          <div key={f.key}>
            <label className="field">{f.label}</label>
            {f.type === 'textarea' ? (
              <textarea className="in" rows={3} placeholder={f.placeholder} value={vars[f.key] || ''} onChange={(e) => setVars({ ...vars, [f.key]: e.target.value })} />
            ) : (
              <input className="in" placeholder={f.placeholder} value={vars[f.key] || ''} onChange={(e) => setVars({ ...vars, [f.key]: e.target.value })} />
            )}
          </div>
        ))}

        <button className="btn ai full" style={{ marginTop: 16 }} onClick={generate} disabled={busy}>
          {busy ? 'Generating…' : tpl.copyOnly ? '✦ Build the prompt' : '✦ Generate with AI'}
        </button>
      </div>

      {out && (
        <div className="card" style={{ padding: 18, marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <b>{tpl.copyOnly ? 'Your prompt' : 'Generated content'}</b>
            <span className="pill" style={{ background: out.source === 'ai' ? 'var(--aiSoft)' : 'var(--goldSoft)', color: out.source === 'ai' ? 'var(--ai)' : 'var(--gold)' }}>
              {out.source === 'ai' ? '✦ AI' : out.source === 'template' ? 'prompt' : 'demo fallback'}
            </span>
          </div>
          <div style={{ whiteSpace: 'pre-wrap', fontSize: 13.5, lineHeight: 1.6, background: 'var(--surface2)', border: '1px solid var(--line)', borderRadius: 12, padding: 14 }}>{out.text}</div>
          {tpl.copyOnly && <div className="tiny muted" style={{ marginTop: 8 }}>Paste this into an image/video tool (Veo, Sora, Runway, Higgsfield…).</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button className="btn brand" onClick={() => { copyText(out.text); toast('Copied ✓'); }}>Copy</button>
            {!tpl.copyOnly && (
              <a className="btn wa" href={`https://wa.me/?text=${encodeURIComponent(out.text)}`} target="_blank" rel="noreferrer">Share on WhatsApp</a>
            )}
            <button className="btn" onClick={generate} disabled={busy}>Regenerate</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Marketing() {
  const [cat, setCat] = useState<MktCategory | 'All'>('All');
  const [sel, setSel] = useState<MktTemplate | null>(null);

  if (sel) {
    return (
      <section className="screen">
        <div className="h1">Marketing studio</div>
        <div className="sub">AI-written listings, ads, social posts, client messages & market analysis.</div>
        <div style={{ marginTop: 16 }}>
          <Generator tpl={sel} onBack={() => setSel(null)} />
        </div>
      </section>
    );
  }

  const list = cat === 'All' ? TEMPLATES : TEMPLATES.filter((t) => t.category === cat);

  return (
    <section className="screen">
      <div className="h1">Marketing studio</div>
      <div className="sub">Turn any listing into polished marketing in seconds — pick a template, hit generate.</div>

      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', margin: '16px 0' }}>
        <button className={cx('chip', cat === 'All' && 'active')} onClick={() => setCat('All')}>All</button>
        {CATEGORIES.map((c) => (
          <button key={c} className={cx('chip', cat === c && 'active')} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))' }}>
        {list.map((t) => (
          <div key={t.id} className="card" style={{ padding: 16, cursor: 'pointer' }} onClick={() => { setSel(t); setCat(cat); }}>
            <div className="linkico" style={{ background: CAT_COLOR[t.category][0], color: CAT_COLOR[t.category][1] }}>{t.emoji}</div>
            <b style={{ display: 'block', marginTop: 10 }}>{t.title}</b>
            <div className="sm muted" style={{ marginTop: 2 }}>{t.desc}</div>
            <div className="tiny" style={{ marginTop: 8, color: CAT_COLOR[t.category][1], fontWeight: 700 }}>{t.category}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
