'use client';

import { useState } from 'react';
import Link from 'next/link';

const SAMPLE = `Running PUB is on sale
Location : Koramangala
Sq Ft : 11,000
No Sitting Pax : 410
No standing pax : 1200
2 bar counters
CL9 : 3,57,000 with 50 lakhs deposit.
Asking price : 4.5 crores
Slightly negotiable
Floor Monthly Rental : 6 Lakhs

Or
RENTAL OPTION with SETUP
WITH CL-9 and floor rent
Monthly- 13,50,000
Security deposit- 2,00,00,000

Immediately for handover.`;

export default function NewListing() {
  const [text, setText] = useState(SAMPLE);
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ url: string; title: string } | null>(null);
  const [err, setErr] = useState('');

  async function create() {
    setBusy(true);
    setErr('');
    setResult(null);
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, brokerPhone: phone || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'failed');
      setResult({ url: data.url, title: data.listing.title });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'failed');
    }
    setBusy(false);
  }

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '32px 16px' }}>
      <Link href="/dashboard" className="sm muted">← Dashboard</Link>
      <h1 className="bric" style={{ marginTop: 12, fontSize: 30, fontWeight: 800, letterSpacing: '-.02em' }}>Create a listing</h1>
      <p className="sub">Paste a property the way you&apos;d type it on WhatsApp. The AI turns it into a polished listing.</p>

      <label className="field">Property details</label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={14}
        className="in"
        style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, lineHeight: 1.6 }}
      />

      <label className="field">Your WhatsApp number <span className="muted" style={{ fontWeight: 400 }}>(optional — powers the Enquire button)</span></label>
      <input className="in" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98xxxxxxxx" inputMode="numeric" />

      <div className="tiny muted" style={{ marginTop: 8 }}>📸 Photos attach automatically when you create via the WhatsApp bot. Here it&apos;s text-only.</div>

      <button className="btn brand full" style={{ marginTop: 16, padding: 14 }} onClick={create} disabled={busy}>
        {busy ? 'Designing your listing…' : 'Generate Airbnb-style listing →'}
      </button>

      {err && (
        <div className="card" style={{ marginTop: 16, padding: 14, background: 'var(--hotSoft)', borderColor: '#f3c7c3', color: 'var(--hot)' }}>
          ⚠️ {err}
          {/supabase/i.test(err) ? <div className="tiny" style={{ marginTop: 4 }}>Set Supabase env vars — see SUPABASE_SETUP.md.</div> : null}
        </div>
      )}

      {result && (
        <div className="card" style={{ marginTop: 20, padding: 18, borderColor: 'var(--brand)' }}>
          <div className="sm" style={{ fontWeight: 700, color: 'var(--brand)' }}>✅ Listing ready</div>
          <div style={{ fontWeight: 700, marginTop: 4 }}>{result.title}</div>
          <a href={result.url} target="_blank" rel="noreferrer" className="urlbox" style={{ display: 'block', marginTop: 8 }}>{result.url}</a>
          <a href={result.url} target="_blank" rel="noreferrer" className="btn brand full" style={{ marginTop: 12 }}>View listing →</a>
        </div>
      )}
    </main>
  );
}
