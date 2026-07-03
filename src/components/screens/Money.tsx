'use client';

import { useState } from 'react';
import { useUI } from '../ui-context';
import { useStore } from '@/lib/store';
import { commission } from '@/lib/commission';
import { formatInr, formatInrShort, parseRupees, RUPEE } from '@/lib/money';
import { COMMS, FIN, K, L, type Comm } from '@/lib/commissions-data';
import { BROKER } from '@/lib/seed';
import { copyText, cx } from '@/lib/util';

type Tab = 'overview' | 'invoices' | 'gst' | 'reports';

const STATUS: Record<string, [string, string, string]> = {
  received: ['var(--brandSoft)', 'var(--brand)', 'paid'],
  overdue: ['var(--hotSoft)', 'var(--hot)', 'overdue'],
  partial: ['var(--goldSoft)', 'var(--gold)', 'partial'],
  pending: ['var(--surface2)', 'var(--ink2)', 'pending'],
  sent: ['var(--blueSoft)', 'var(--blue)', 'sent'],
};
const barColor = (s: string) => (s === 'received' ? 'var(--money)' : s === 'overdue' ? 'var(--hot)' : s === 'partial' ? 'var(--gold)' : 'var(--ink3)');

function Badge({ status }: { status: string }) {
  const [bg, fg, label] = STATUS[status] || STATUS.pending;
  return <span className="pill" style={{ background: bg, color: fg }}>{label}</span>;
}

function AiBrief({ icon, tag, body }: { icon: string; tag: string; body: string }) {
  return (
    <div className="card" style={{ padding: 14, display: 'flex', gap: 12, background: 'linear-gradient(110deg,#FFF8E8,#FFF1D6)', border: '1px solid #F2D89A', marginBottom: 16 }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#E8A830,#F0BE5C)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{icon}</div>
      <div>
        <div className="tiny" style={{ fontWeight: 800, color: '#8a5e00', letterSpacing: '.5px' }}>{tag}</div>
        <div className="sm" style={{ color: '#5a3d00', marginTop: 3, lineHeight: 1.5 }}>{body}</div>
      </div>
    </div>
  );
}

function Stat({ num, label, trend, color, down, onClick }: { num: string; label: string; trend?: string; color?: string; down?: boolean; onClick?: () => void }) {
  return (
    <div className="stat" style={{ cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <div className="n bric tnum" style={{ color }}>{num}</div>
      <div className="l">{label}</div>
      {trend && <div className="tiny" style={{ marginTop: 5, fontWeight: 600, color: down ? 'var(--hot)' : 'var(--money)' }}>{trend}</div>}
    </div>
  );
}

function CommCard({ c, onOpen }: { c: Comm; onOpen: () => void }) {
  const color = barColor(c.status);
  const paidPct = Math.round((c.got / c.exp) * 100);
  return (
    <div className="card" style={{ padding: 14, marginBottom: 10, cursor: 'pointer' }} onClick={onOpen}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        <div style={{ width: 4, height: 40, borderRadius: 2, background: color, flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{c.deal}</div>
          <div className="tiny muted" style={{ marginTop: 2 }}>{c.client} · {c.clientType} · {c.salePrice}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="tnum" style={{ fontSize: 15, fontWeight: 700, color }}>{K(c.got)} / {K(c.exp)}</div>
          <Badge status={c.status} />
        </div>
      </div>
      <div style={{ height: 4, background: 'var(--surface2)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
        <div style={{ height: '100%', width: `${paidPct}%`, background: color, borderRadius: 2 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink3)' }}>
        <span>Invoice: {c.invoiceDate} · Due: {c.dueDate}</span>
        <span>{paidPct}% collected</span>
      </div>
      {c.split && (
        <div style={{ marginTop: 8, padding: '8px 10px', background: 'var(--surface2)', borderRadius: 10, fontSize: 11, color: 'var(--ink2)' }}>
          ⑃ Co-broke split: You {c.split.pct.split('/')[0]}% ({K(c.split.yours)}) · {c.split.coBroker} {c.split.pct.split('/')[1]}% ({K(c.split.theirs)}) ·{' '}
          {c.split.theirStatus === 'paid' ? <span style={{ color: 'var(--money)' }}>Both paid ✓</span> : <span style={{ color: 'var(--gold)' }}>Split pending</span>}
        </div>
      )}
    </div>
  );
}

function InvoiceRow({ c, onOpen }: { c: Comm; onOpen: () => void }) {
  const color = barColor(c.status);
  const toast = useStore((s) => s.toast);
  const steps = ['Generated', 'Sent', 'Viewed', 'Paid'];
  const stepIdx = c.invoiceStatus === 'paid' ? 3 : 1 + (c.invoiceStatus === 'sent' || c.invoiceStatus === 'overdue' || c.invoiceStatus === 'paid_partial' ? 1 : 0);
  return (
    <div className="card" style={{ padding: 14, marginBottom: 10, cursor: 'pointer' }} onClick={onOpen}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{c.deal}</div>
          <div className="tiny muted" style={{ marginTop: 2 }}>{c.client} · {c.salePrice} · {c.commPct} commission</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="tnum" style={{ fontSize: 15, fontWeight: 700, color }}>{K(c.exp)}</div>
          <div className="tiny muted">+ {K(c.gst)} GST</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ height: 4, borderRadius: 2, background: i <= stepIdx ? color : 'var(--surface2)', marginBottom: 4 }} />
            <div style={{ fontSize: 10, color: i <= stepIdx ? 'var(--ink)' : 'var(--ink3)', fontWeight: i === stepIdx ? 600 : 400 }}>{s}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {c.status === 'overdue' && <button className="btn sm" style={{ background: 'var(--hotSoft)', color: 'var(--hot)', border: 'none' }} onClick={(e) => { e.stopPropagation(); toast(`⚖️ Legal notice sent to ${c.client}`); }}>⚖️ Legal notice</button>}
        {c.status !== 'received' && <button className="btn sm" onClick={(e) => { e.stopPropagation(); toast(`🔔 Reminder sent to ${c.client}`); }}>🔔 Remind</button>}
        <button className="btn sm" onClick={(e) => { e.stopPropagation(); toast('📄 Invoice PDF opened'); }}>View</button>
        <button className="btn sm" onClick={(e) => { e.stopPropagation(); copyText('https://' + c.payLink); toast('🔗 Payment link copied'); }}>Pay link</button>
      </div>
    </div>
  );
}

function CommDetail({ id }: { id: string }) {
  const c = COMMS.find((x) => x.id === id);
  const toast = useStore((s) => s.toast);
  if (!c) return null;
  const color = barColor(c.status);
  const balance = c.exp - c.got;
  const Row = ({ k, v, vc }: { k: string; v: string; vc?: string }) => (
    <div className="inv-line"><span className="muted">{k}</span><b className="tnum" style={{ color: vc }}>{v}</b></div>
  );
  return (
    <div style={{ padding: 22 }}>
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.3px' }}>{c.deal}</div>
      <div className="sm muted" style={{ marginTop: 4 }}>{c.client} · {c.clientType} · Registered {c.regDate}</div>
      <div className="card" style={{ padding: 14, marginTop: 14, boxShadow: 'none', background: 'var(--surface2)' }}>
        <Row k="Sale price" v={c.salePrice} />
        <Row k={`Commission (${c.commPct})`} v={K(c.exp)} />
        <Row k="GST (18%)" v={K(c.gst)} />
        <Row k="Total invoice" v={K(c.exp + c.gst)} />
        <Row k="Received" v={K(c.got)} vc={color} />
        <div className="inv-line" style={{ border: 'none' }}><span className="muted">Balance</span><b className="tnum" style={{ color: balance > 0 ? 'var(--hot)' : 'var(--money)' }}>{K(balance)}</b></div>
      </div>
      {c.split && (
        <div className="card" style={{ padding: 14, marginTop: 10 }}>
          <div className="tiny" style={{ fontWeight: 700, color: 'var(--ink2)', letterSpacing: '.4px', marginBottom: 8 }}>CO-BROKING SPLIT</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{BROKER.initials}</div>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>You ({c.split.pct.split('/')[0]}%)</div>
            <b>{K(c.split.yours)}</b>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="avatar" style={{ width: 32, height: 32, fontSize: 12, background: 'var(--blue)' }}>{c.split.coBroker.split(' ').map((w) => w[0]).join('')}</div>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{c.split.coBroker} ({c.split.pct.split('/')[1]}%)</div>
            <b>{K(c.split.theirs)}</b>
          </div>
        </div>
      )}
      <div className="tiny" style={{ fontWeight: 700, color: 'var(--ink2)', letterSpacing: '.4px', margin: '14px 0 8px' }}>PAYMENT LINK</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--brandSoft)', borderRadius: 10, padding: '10px 12px', fontFamily: 'ui-monospace,monospace', fontSize: 12, color: 'var(--brand)' }}>
        🔗 {c.payLink}
        <button className="tiny" style={{ marginLeft: 'auto', color: 'var(--brand)', fontWeight: 600, background: 'none', border: 'none' }} onClick={() => { copyText('https://' + c.payLink); toast('🔗 Link copied'); }}>Copy</button>
      </div>
      <div className="tiny" style={{ fontWeight: 700, color: 'var(--ink2)', letterSpacing: '.4px', margin: '14px 0 8px' }}>TIMELINE</div>
      <div className="card" style={{ padding: 12 }}>
        {c.timeline.map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: i < c.timeline.length - 1 ? '1px solid var(--line2)' : 'none' }}>
            <span style={{ fontSize: 11, color: 'var(--ink3)', minWidth: 56, fontFamily: 'ui-monospace,monospace' }}>{t.d}</span>
            <span style={{ fontSize: 12, flex: 1 }}>{t.e}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <button className="btn brand sm" onClick={() => toast('📄 Invoice PDF downloaded')}>📥 Download invoice</button>
        <button className="btn sm" onClick={() => toast(`📤 Invoice resent to ${c.client}`)}>Resend</button>
        {c.status === 'overdue' && <button className="btn sm" style={{ background: 'var(--hotSoft)', color: 'var(--hot)', border: 'none' }} onClick={() => toast('⚖️ Legal notice approved and sent')}>⚖️ Approve legal notice</button>}
      </div>
    </div>
  );
}

function Calculator() {
  const properties = useStore((s) => s.properties);
  const genInvoice = useStore((s) => s.genInvoice);
  const toast = useStore((s) => s.toast);
  const { closeModal } = useUI();
  const [propId, setPropId] = useState(properties[0]?.id || '');
  const [client, setClient] = useState('');
  const [valueStr, setValueStr] = useState(properties[0] ? String(Math.round(properties[0].price / RUPEE)) : '');
  const [rate, setRate] = useState('2');
  const [cobroke, setCobroke] = useState('0');
  const [split, setSplit] = useState('60');

  const isCo = cobroke === '1';
  const c = commission({ valuePaise: parseRupees(valueStr), ratePct: Number(rate) || 0, cobroke: isCo, splitPct: Number(split) || 0 });

  return (
    <div style={{ padding: 22 }}>
      <div style={{ fontSize: 18, fontWeight: 700 }}>New invoice</div>
      <div className="sm muted" style={{ marginTop: 3 }}>GST-compliant, with a payment link. The math runs on integer paise.</div>
      <div className="row2" style={{ marginTop: 12 }}>
        <div>
          <label className="field">Deal / property</label>
          <select className="in" value={propId} onChange={(e) => { setPropId(e.target.value); const p = properties.find((x) => x.id === e.target.value); if (p) setValueStr(String(Math.round(p.price / RUPEE))); }}>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.title} — {formatInrShort(p.price)}</option>)}
          </select>
        </div>
        <div><label className="field">Client</label><input className="in" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Buyer name" /></div>
      </div>
      <div className="row2">
        <div><label className="field">Sale value (₹)</label><input className="in tnum" inputMode="numeric" value={valueStr} onChange={(e) => setValueStr(e.target.value)} /></div>
        <div><label className="field">Commission %</label><input className="in tnum" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} /></div>
      </div>
      <div className="row2">
        <div>
          <label className="field">Co-broked?</label>
          <select className="in" value={cobroke} onChange={(e) => setCobroke(e.target.value)}><option value="0">No — full commission</option><option value="1">Yes — split</option></select>
        </div>
        <div><label className="field">Your split %</label><input className="in tnum" inputMode="numeric" value={split} onChange={(e) => setSplit(e.target.value)} /></div>
      </div>
      <div className="card" style={{ padding: 16, marginTop: 14, background: 'var(--brandSoft)', borderColor: '#CFE7DA' }}>
        <div className="inv-line" style={{ borderColor: '#CFE7DA' }}><span className="muted">Gross commission</span><b className="tnum">{formatInr(c.gross)}</b></div>
        <div className="inv-line" style={{ borderColor: '#CFE7DA' }}><span className="muted">{isCo ? `Your share (${split}%)` : 'Your share'}</span><b className="tnum">{formatInr(c.share)}</b></div>
        <div className="inv-line" style={{ borderColor: '#CFE7DA' }}><span className="muted">GST (18%)</span><b className="tnum">{formatInr(c.gst)}</b></div>
        <div className="inv-total"><span className="muted">You invoice</span><b className="bric tnum" style={{ fontSize: 24, color: 'var(--brandD)' }}>{formatInr(c.total)}</b></div>
      </div>
      <button className="btn brand full" style={{ marginTop: 14 }} onClick={() => { const p = properties.find((x) => x.id === propId); const inv = genInvoice({ propId, title: p?.title || 'Deal', client, value: parseRupees(valueStr), rate: Number(rate) || 0, cobroke: isCo, split: Number(split) || 0 }); toast('Invoice ' + inv.no + ' generated + Razorpay link created'); closeModal(); }}>Generate GST invoice + payment link</button>
    </div>
  );
}

export function Money() {
  const { showModal } = useUI();
  const [tab, setTab] = useState<Tab>('overview');
  const [invFilter, setInvFilter] = useState<'all' | 'received' | 'pending' | 'overdue'>('all');

  const earnedDiff = Math.round((Math.abs(FIN.thisMonth.earned - FIN.lastMonth.earned) / FIN.lastMonth.earned) * 100);
  const invList = COMMS.filter((c) => invFilter === 'all' || (invFilter === 'pending' ? c.status === 'pending' || c.status === 'partial' : c.status === invFilter));
  const openDetail = (id: string) => showModal(<CommDetail id={id} />);

  return (
    <section className="screen">
      <div className="h1">Money</div>
      <div className="sub">Commissions, GST-ready invoices, and your finances — the calculator math actually runs.</div>

      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', margin: '16px 0 8px' }}>
        {([['overview', 'Overview'], ['invoices', `Invoices · ${COMMS.length}`], ['gst', 'GST & Tax'], ['reports', 'Reports']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} className={cx('chip', tab === t && 'active')} onClick={() => setTab(t)}>{label}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <AiBrief icon="✨" tag="AI FINANCE BRIEF" body={`Green Valley commission is 18 days overdue — legal notice ready for your approval. This month you've earned ${L(FIN.thisMonth.earned)}, up ${earnedDiff}% vs last month. ${L(FIN.thisMonth.pending)} pending across 2 deals. GST filing for Q2 is due Jul 15 — your summary is ready.`} />
          <div className="stats">
            <Stat num={L(FIN.thisMonth.earned)} label="Earned this month" trend={`↑ ${earnedDiff}% vs last month`} color="var(--money)" onClick={() => setTab('invoices')} />
            <Stat num={L(FIN.thisMonth.pending)} label="Pending" trend="2 invoices out" color="var(--gold)" />
            <Stat num={L(FIN.thisMonth.overdue)} label="Overdue" trend="18 days · Green Valley" down color="var(--hot)" />
            <Stat num={L(FIN.thisMonth.gstCollected)} label="GST collected" trend="Q2 filing due Jul 15" onClick={() => setTab('gst')} />
          </div>

          <div className="grid g2" style={{ marginTop: 18 }}>
            <div>
              <div className="sectionh">Active commissions <span className="tiny muted">{COMMS.length} deals</span></div>
              {COMMS.map((c) => <CommCard key={c.id} c={c} onOpen={() => openDetail(c.id)} />)}
            </div>
            <div>
              <div className="sectionh">Quick actions</div>
              <div className="card">
                <div className="linkrow" style={{ cursor: 'pointer' }} onClick={() => showModal(<Calculator />)}>
                  <div className="linkico" style={{ background: 'var(--brandSoft)', color: 'var(--brand)' }}>🧾</div>
                  <div style={{ flex: 1 }}><b>Create invoice</b><div className="sm muted">GST-compliant with payment link</div></div>
                  <span className="muted">›</span>
                </div>
                <div className="linkrow" style={{ cursor: 'pointer' }} onClick={() => openDetail('c2')}>
                  <div className="linkico" style={{ background: 'var(--hotSoft)', color: 'var(--hot)' }}>⚖️</div>
                  <div style={{ flex: 1 }}><b>Review legal notice</b><div className="sm muted">Green Valley · approve to send</div></div>
                  <span className="muted">›</span>
                </div>
                <div className="linkrow" style={{ cursor: 'pointer' }} onClick={() => setTab('gst')}>
                  <div className="linkico" style={{ background: 'var(--goldSoft)', color: 'var(--gold)' }}>🧾</div>
                  <div style={{ flex: 1 }}><b>Q2 GST summary</b><div className="sm muted">Ready to file · due Jul 15</div></div>
                  <span className="muted">›</span>
                </div>
              </div>
              <div className="sectionh">Monthly trend</div>
              <div className="card" style={{ padding: 14 }}>
                {[{ m: 'Apr', e: 1.8 }, { m: 'May', e: 1.8 }, { m: 'Jun', e: 2.16 }].map((r) => (
                  <div key={r.m} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                    <span className="tiny muted" style={{ minWidth: 32 }}>{r.m}</span>
                    <div style={{ flex: 1, height: 24, background: 'var(--surface2)', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.round((r.e / 2.5) * 100)}%`, background: 'var(--money)', borderRadius: 6, display: 'flex', alignItems: 'center', paddingLeft: 8, fontSize: 11, fontWeight: 600, color: '#fff' }}>₹{r.e}L</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'invoices' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {([['all', `All ${COMMS.length}`], ['received', `Paid ${COMMS.filter((c) => c.status === 'received').length}`], ['pending', `Pending ${COMMS.filter((c) => c.status === 'pending' || c.status === 'partial').length}`], ['overdue', `Overdue ${COMMS.filter((c) => c.status === 'overdue').length}`]] as [typeof invFilter, string][]).map(([f, label]) => (
                <button key={f} className={cx('chip', invFilter === f && 'active')} onClick={() => setInvFilter(f)}>{label}</button>
              ))}
            </div>
            <button className="btn brand sm" onClick={() => showModal(<Calculator />)}>+ New invoice</button>
          </div>
          {invList.map((c) => <InvoiceRow key={c.id} c={c} onOpen={() => openDetail(c.id)} />)}
        </>
      )}

      {tab === 'gst' && (
        <>
          <AiBrief icon="🧾" tag="GST SUMMARY" body={`Your Q2 (Apr–Jun 2026) GST liability is ${L(FIN.quarterly.q2.gst)} on commission income of ${L(FIN.quarterly.q2.earned)}. Filing deadline: July 15, 2026. All invoices are GST-compliant and export-ready.`} />
          <div className="stats">
            <Stat num={L(FIN.yearTotal.earned)} label="Total earned (FY 2026-27)" />
            <Stat num={L(FIN.yearTotal.gst)} label="GST collected (18%)" />
            <Stat num={String(FIN.yearTotal.deals)} label="Deals closed" />
          </div>
          <div className="sectionh">Quarterly breakdown</div>
          <div className="card" style={{ padding: 14, overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--ink2)', fontSize: 12 }}>
                <th style={{ textAlign: 'left', padding: '8px 0' }}>Quarter</th><th style={{ textAlign: 'right' }}>Commission</th><th style={{ textAlign: 'right' }}>GST (18%)</th><th style={{ textAlign: 'right' }}>Total billed</th><th style={{ textAlign: 'right' }}>Status</th>
              </tr></thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--line)' }}><td style={{ padding: '10px 0', fontWeight: 600 }}>Q1 (Apr–Jun)</td><td style={{ textAlign: 'right' }}>{L(FIN.quarterly.q1.earned)}</td><td style={{ textAlign: 'right' }}>{L(FIN.quarterly.q1.gst)}</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{L(FIN.quarterly.q1.earned + FIN.quarterly.q1.gst)}</td><td style={{ textAlign: 'right' }}><span className="pill" style={{ background: 'var(--brandSoft)', color: 'var(--brand)' }}>Filed</span></td></tr>
                <tr><td style={{ padding: '10px 0', fontWeight: 600 }}>Q2 (Jul–Sep)</td><td style={{ textAlign: 'right' }}>{L(FIN.quarterly.q2.earned)}</td><td style={{ textAlign: 'right' }}>{L(FIN.quarterly.q2.gst)}</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{L(FIN.quarterly.q2.earned + FIN.quarterly.q2.gst)}</td><td style={{ textAlign: 'right' }}><span className="pill" style={{ background: 'var(--goldSoft)', color: 'var(--gold)' }}>Due Jul 15</span></td></tr>
              </tbody>
            </table>
          </div>
          <div className="sectionh">Invoice register <span className="tiny muted">tax-ready export</span></div>
          <div className="card" style={{ padding: 14, overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', minWidth: 560 }}>
              <thead><tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--ink2)' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Invoice #</th><th style={{ textAlign: 'left' }}>Date</th><th style={{ textAlign: 'left' }}>Client</th><th style={{ textAlign: 'right' }}>Commission</th><th style={{ textAlign: 'right' }}>GST</th><th style={{ textAlign: 'right' }}>Total</th><th style={{ textAlign: 'right' }}>Status</th>
              </tr></thead>
              <tbody>{COMMS.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: 8, fontFamily: 'ui-monospace,monospace', fontSize: 11 }}>BK-2406-00{i + 1}</td>
                  <td style={{ padding: 8 }}>{c.invoiceDate}</td>
                  <td style={{ padding: 8, fontWeight: 600 }}>{c.client}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{K(c.exp)}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{K(c.gst)}</td>
                  <td style={{ padding: 8, textAlign: 'right', fontWeight: 600 }}>{K(c.exp + c.gst)}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}><Badge status={c.status} /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <button className="btn brand sm" onClick={() => useStore.getState().toast('📥 GST summary downloaded as PDF')}>📥 Download for CA</button>
            <button className="btn sm" onClick={() => useStore.getState().toast('📧 Sent to your CA via email')}>📧 Email to CA</button>
            <button className="btn sm" onClick={() => useStore.getState().toast('📊 Excel exported')}>Export Excel</button>
          </div>
        </>
      )}

      {tab === 'reports' && (
        <>
          <AiBrief icon="📊" tag="FINANCIAL REPORT" body={`Your brokerage earned ${L(FIN.yearTotal.earned)} this financial year across ${FIN.yearTotal.deals} deals. Average commission per deal: ${K(Math.round(FIN.yearTotal.earned / FIN.yearTotal.deals))}. Best month: June (₹2.16L). Co-broking contributed 24% of revenue.`} />
          <div className="grid g2">
            <div>
              <div className="sectionh">Earnings by source</div>
              <div className="card" style={{ padding: 14 }}>
                {[{ src: 'Direct deals', amt: 6.8, pct: 60, c: 'var(--money)' }, { src: 'Co-broking (your listings)', amt: 2.7, pct: 24, c: 'var(--ai)' }, { src: "Co-broking (others' listings)", amt: 1.1, pct: 10, c: 'var(--gold)' }, { src: 'Rental agreements', amt: 0.7, pct: 6, c: 'var(--ink3)' }].map((r) => (
                  <div key={r.src} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--line2)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.c, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13 }}>{r.src}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>₹{r.amt}L</span>
                    <span className="tiny muted" style={{ minWidth: 36, textAlign: 'right' }}>{r.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="sectionh">Collection efficiency</div>
              <div className="card" style={{ padding: 14 }}>
                {[['Invoices sent', String(FIN.thisMonth.invoicesSent + FIN.lastMonth.invoicesSent), undefined], ['Paid within 7 days', '5 (71%)', 'var(--money)'], ['Paid after reminder', '1 (14%)', 'var(--gold)'], ['Currently overdue', '1 (14%)', 'var(--hot)'], ['Avg collection time', '8.3 days', undefined]].map(([k, v, c], i, arr) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--line2)' : 'none' }}>
                    <span className="sm muted">{k}</span><span style={{ fontWeight: 600, color: c as string }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <button className="btn brand sm" onClick={() => useStore.getState().toast('📥 Full P&L report downloaded')}>📥 Download P&L</button>
            <button className="btn sm" onClick={() => useStore.getState().toast('📧 Report emailed to you')}>📧 Email report</button>
          </div>
        </>
      )}
    </section>
  );
}
