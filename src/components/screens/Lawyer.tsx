'use client';

import { useState } from 'react';
import { useUI } from '../ui-context';
import { useStore } from '@/lib/store';
import { stampSale, stampRent } from '@/lib/stampduty';
import { formatInr, parseRupees, bpsOf } from '@/lib/money';
import { BROKER } from '@/lib/seed';
import { commercialLease, type LeaseData } from '@/lib/legal';
import { cx } from '@/lib/util';

interface DeedData {
  type: 'rent' | 'sale';
  propTitle: string;
  area: string;
  A: string;
  B: string;
  amtPaise: number;
  term: string;
}

function DeedModal({ d }: { d: DeedData }) {
  const toast = useStore((s) => s.toast);
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const A = d.A || 'Party A';
  const B = d.B || 'Party B';

  const title = d.type === 'rent' ? 'RENTAL AGREEMENT' : 'AGREEMENT TO SELL';
  const body =
    d.type === 'rent'
      ? `This Rental Agreement is made on ${today} at ${BROKER.city} between ${A} ("Lessor") and ${B} ("Lessee").

1. The Lessor lets to the Lessee the property: ${d.propTitle}, ${d.area}, ${BROKER.city}.
2. The tenancy is for a term of ${d.term}, commencing on the date above.
3. The Lessee shall pay a monthly rent of ${formatInr(d.amtPaise)}, payable in advance on or before the 5th of each month.
4. The Lessee shall pay a refundable security deposit of ${formatInr(d.amtPaise * 10)}.
5. The Lessee shall use the premises for residential purposes only and maintain it in good condition.
6. Either party may terminate this agreement with one (1) month's written notice.
7. This agreement is governed by the laws of Karnataka, India.`
      : `This Agreement to Sell is made on ${today} at ${BROKER.city} between ${A} ("Seller") and ${B} ("Purchaser").

1. The Seller agrees to sell the property: ${d.propTitle}, ${d.area}, ${BROKER.city}, free of encumbrances.
2. The total sale consideration is ${formatInr(d.amtPaise)}.
3. The Purchaser has paid an advance/token of ${formatInr(bpsOf(d.amtPaise, 1000))}, receipt acknowledged.
4. The balance shall be paid at the time of registration of the sale deed, within ${d.term}.
5. The Seller shall hand over vacant, peaceful possession on completion.
6. Stamp duty and registration charges shall be borne by the Purchaser.
7. This agreement is governed by the laws of Karnataka, India.`;

  return (
    <div style={{ padding: 26 }}>
      <div style={{ textAlign: 'center', borderBottom: '2px solid var(--ink)', paddingBottom: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: '.2em', color: 'var(--ink2)' }}>DRAFT · NOT LEGAL ADVICE</div>
        <div className="bric" style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>
          {title}
        </div>
      </div>
      <div style={{ whiteSpace: 'pre-line', fontSize: 13.5, lineHeight: 1.7, marginTop: 16 }}>{body}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 36, fontSize: 13 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid var(--ink)', paddingTop: 6, width: 130 }}>{A}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid var(--ink)', paddingTop: 6, width: 130 }}>{B}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
        <button className="btn ink" onClick={() => window.print()}>
          Print / PDF
        </button>
        <button className="btn" onClick={() => toast('Draft sent to client on WhatsApp (demo)')}>
          Send to client
        </button>
      </div>
      <div className="tiny muted" style={{ marginTop: 12 }}>
        Auto-generated draft. Have it reviewed before signing.
      </div>
    </div>
  );
}

function LeaseModal({ d }: { d: LeaseData }) {
  const toast = useStore((s) => s.toast);
  const body = commercialLease(d);
  return (
    <div style={{ padding: 26 }}>
      <div style={{ textAlign: 'center', borderBottom: '2px solid var(--ink)', paddingBottom: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: '.2em', color: 'var(--ink2)' }}>DRAFT · NOT LEGAL ADVICE</div>
        <div className="bric" style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>COMMERCIAL RENTAL AGREEMENT</div>
      </div>
      <div style={{ whiteSpace: 'pre-line', fontSize: 12.5, lineHeight: 1.7, marginTop: 16, fontFamily: 'Georgia, serif' }}>{body}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 30, fontSize: 12, gap: 20 }}>
        <div style={{ flex: 1 }}><div style={{ borderTop: '1px solid var(--ink)', paddingTop: 6 }}>LESSOR / OWNER<br />{d.lessorName}{d.lessorRep ? ` (${d.lessorRep})` : ''}</div></div>
        <div style={{ flex: 1 }}><div style={{ borderTop: '1px solid var(--ink)', paddingTop: 6 }}>LESSEE / TENANT<br />{d.lesseeName}{d.lesseeRep ? ` (${d.lesseeRep})` : ''}</div></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, fontSize: 12, gap: 20 }}>
        <div style={{ flex: 1 }}><div style={{ borderTop: '1px solid var(--ink)', paddingTop: 6 }}>WITNESS 1</div></div>
        <div style={{ flex: 1 }}><div style={{ borderTop: '1px solid var(--ink)', paddingTop: 6 }}>WITNESS 2</div></div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 22, flexWrap: 'wrap' }}>
        <button className="btn ink" onClick={() => window.print()}>Print / PDF</button>
        <button className="btn" onClick={() => toast('Draft sent to client on WhatsApp (demo)')}>Send to client</button>
      </div>
      <div className="tiny muted" style={{ marginTop: 12 }}>
        Auto-generated draft based on a standard Karnataka commercial lease. Have it reviewed by an advocate before signing.
      </div>
    </div>
  );
}

const DEFAULT_LEASE: LeaseData = {
  executionDate: '',
  place: 'Bangalore',
  lessorName: 'Sushma Marur',
  lessorRep: 'Dr. S. Chandra Reddy, GPA Holder',
  lessorAddress: 'No. 138, 3rd Cross, 4th Phase, Dollars Colony, J.P. Nagar, Bangalore 560078',
  lesseeName: 'Nish Hair Pvt Ltd',
  lesseeRep: 'Ms. Parul Gulati, Director',
  lesseeAddress: '1st Floor, Sai Iconic, Four Bungalows, Andheri West, Mumbai 400053',
  premisesNo: '25/5',
  complexName: 'Maaruth Complex',
  premisesAddress: 'Lavelle Road, Bangalore 560001, Karnataka',
  floor: 'First Floor',
  sbaSqft: 1500,
  carpetSqft: 1300,
  monthlyRent: 165000,
  maintenance: 5000,
  gst: true,
  enhancementPct: 5,
  depositAmount: 1280000,
  depositMonths: 8,
  termYears: 5,
  lockInYears: 3,
  fitoutDays: 30,
  rentStartDate: '14 August 2025',
  commenceDate: '09 July 2025',
  waterCharges: 3000,
};

export function Lawyer() {
  const properties = useStore((s) => s.properties);
  const { showModal } = useUI();

  const [sdValue, setSdValue] = useState('15000000');
  const [sdType, setSdType] = useState<'sale' | 'rent'>('sale');

  const [dgType, setDgType] = useState<'rent' | 'sale'>('rent');
  const [dgProp, setDgProp] = useState('');
  const [dgA, setDgA] = useState(BROKER.name);
  const [dgB, setDgB] = useState('');
  const [dgAmt, setDgAmt] = useState('55000');
  const [dgTerm, setDgTerm] = useState('11 months');

  const [lease, setLease] = useState<LeaseData>(DEFAULT_LEASE);
  const upLease = (k: keyof LeaseData, v: string | number | boolean) => setLease((l) => ({ ...l, [k]: v }) as LeaseData);
  function lf(label: string, k: keyof LeaseData, opts: { num?: boolean; full?: boolean } = {}) {
    return (
      <div style={opts.full ? { gridColumn: '1 / -1' } : undefined}>
        <label className="field">{label}</label>
        <input
          className={cx('in', opts.num && 'tnum')}
          inputMode={opts.num ? 'numeric' : undefined}
          value={String(lease[k])}
          onChange={(e) => upLease(k, opts.num ? Number(e.target.value.replace(/[^\d]/g, '')) || 0 : e.target.value)}
        />
      </div>
    );
  }
  function generateLease() {
    const executionDate = lease.executionDate || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    showModal(<LeaseModal d={{ ...lease, executionDate }} />);
  }

  const valuePaise = parseRupees(sdValue);
  const sale = stampSale(valuePaise);
  const rent = stampRent(valuePaise);

  function generateDeed() {
    const p = properties.find((x) => x.id === (dgProp || properties[0]?.id)) || {
      title: 'the Property',
      area: BROKER.city,
    };
    showModal(
      <DeedModal
        d={{
          type: dgType,
          propTitle: p.title,
          area: p.area,
          A: dgA,
          B: dgB,
          amtPaise: parseRupees(dgAmt),
          term: dgTerm,
        }}
      />,
    );
  }

  return (
    <section className="screen">
      <div className="h1">InBuilt lawyer</div>
      <div className="sub">Stamp duty estimates and ready-to-sign deed drafts — Karnataka.</div>

      <div className="card" style={{ padding: 18, marginTop: 16 }}>
        <b>Stamp duty &amp; registration calculator</b>
        <div className="row2">
          <div>
            <label className="field">{sdType === 'rent' ? 'Monthly rent (₹)' : 'Property value (₹)'}</label>
            <input className="in tnum" inputMode="numeric" value={sdValue} onChange={(e) => setSdValue(e.target.value)} />
          </div>
          <div>
            <label className="field">Transaction</label>
            <select className="in" value={sdType} onChange={(e) => setSdType(e.target.value as 'sale' | 'rent')}>
              <option value="sale">Sale / purchase</option>
              <option value="rent">Rental agreement</option>
            </select>
          </div>
        </div>
        <div className="card" style={{ padding: 16, marginTop: 14, background: 'var(--goldSoft)', borderColor: '#EAD9AE' }}>
          {sdType === 'sale' ? (
            <>
              <div className="inv-line" style={{ borderColor: '#EAD9AE' }}>
                <span className="muted">Stamp duty (5%)</span>
                <b className="tnum">{formatInr(sale.stamp)}</b>
              </div>
              <div className="inv-line" style={{ borderColor: '#EAD9AE' }}>
                <span className="muted">Cess (0.5%)</span>
                <b className="tnum">{formatInr(sale.cess)}</b>
              </div>
              <div className="inv-line" style={{ borderColor: '#EAD9AE' }}>
                <span className="muted">Registration (1%)</span>
                <b className="tnum">{formatInr(sale.reg)}</b>
              </div>
              <div className="inv-total" style={{ borderTopColor: '#C98A15' }}>
                <b>Total payable</b>
                <b className="bric tnum" style={{ fontSize: 22, color: 'var(--gold)' }}>
                  {formatInr(sale.total)}
                </b>
              </div>
            </>
          ) : (
            <>
              <div className="sm muted" style={{ marginBottom: 8 }}>
                Karnataka rental agreement (11-month), on {formatInr(valuePaise)}/mo
              </div>
              <div className="inv-line" style={{ borderColor: '#EAD9AE' }}>
                <span className="muted">Stamp (0.5% of annual)</span>
                <b className="tnum">{formatInr(rent.stamp)}</b>
              </div>
              <div className="inv-line" style={{ borderColor: '#EAD9AE' }}>
                <span className="muted">Registration</span>
                <b className="tnum">{formatInr(rent.reg)}</b>
              </div>
              <div className="inv-total" style={{ borderTopColor: '#C98A15' }}>
                <b>Total</b>
                <b className="bric tnum" style={{ fontSize: 22, color: 'var(--gold)' }}>
                  {formatInr(rent.total)}
                </b>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 18, marginTop: 16 }}>
        <b>Deed generator</b>
        <div className="row2">
          <div>
            <label className="field">Document</label>
            <select className="in" value={dgType} onChange={(e) => setDgType(e.target.value as 'rent' | 'sale')}>
              <option value="rent">Rental agreement</option>
              <option value="sale">Sale agreement</option>
            </select>
          </div>
          <div>
            <label className="field">Property</label>
            <select className="in" value={dgProp} onChange={(e) => setDgProp(e.target.value)}>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="row2">
          <div>
            <label className="field">Party A (owner / seller)</label>
            <input className="in" value={dgA} onChange={(e) => setDgA(e.target.value)} />
          </div>
          <div>
            <label className="field">Party B (tenant / buyer)</label>
            <input className="in" value={dgB} onChange={(e) => setDgB(e.target.value)} placeholder="Counterparty name" />
          </div>
        </div>
        <div className="row2">
          <div>
            <label className="field">Amount (₹ / mo or sale)</label>
            <input className="in tnum" inputMode="numeric" value={dgAmt} onChange={(e) => setDgAmt(e.target.value)} />
          </div>
          <div>
            <label className="field">Term</label>
            <input className="in" value={dgTerm} onChange={(e) => setDgTerm(e.target.value)} />
          </div>
        </div>
        <button className="btn ink full" style={{ marginTop: 14 }} onClick={generateDeed}>
          Generate deed draft
        </button>
      </div>

      <div className="card" style={{ padding: 18, marginTop: 16 }}>
        <b>Commercial rental agreement</b>
        <div className="sm muted" style={{ marginTop: 3 }}>
          A full Karnataka commercial lease — 15 clauses, schedule, lock-in, arbitration, witnesses. Prefilled with a sample; edit and generate.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, marginTop: 12 }}>
          {lf('Lessor (owner)', 'lessorName')}
          {lf('Lessor representative / GPA', 'lessorRep')}
          {lf('Lessor address', 'lessorAddress', { full: true })}
          {lf('Lessee (tenant / company)', 'lesseeName')}
          {lf('Lessee representative', 'lesseeRep')}
          {lf('Lessee address', 'lesseeAddress', { full: true })}
          {lf('Premises no.', 'premisesNo')}
          {lf('Complex name', 'complexName')}
          {lf('Premises address', 'premisesAddress', { full: true })}
          {lf('Floor', 'floor')}
          {lf('Place / city', 'place')}
          {lf('SBA (sq.ft)', 'sbaSqft', { num: true })}
          {lf('Carpet (sq.ft)', 'carpetSqft', { num: true })}
          {lf('Monthly rent (₹)', 'monthlyRent', { num: true })}
          {lf('Maintenance (₹/mo)', 'maintenance', { num: true })}
          {lf('Annual enhancement (%)', 'enhancementPct', { num: true })}
          {lf('Water charges (₹/mo)', 'waterCharges', { num: true })}
          {lf('Deposit (₹)', 'depositAmount', { num: true })}
          {lf('Deposit (months)', 'depositMonths', { num: true })}
          {lf('Term (years)', 'termYears', { num: true })}
          {lf('Lock-in (years)', 'lockInYears', { num: true })}
          {lf('Fit-out (days)', 'fitoutDays', { num: true })}
          {lf('Commencement date', 'commenceDate')}
          {lf('Rent start date', 'rentStartDate')}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <input type="checkbox" checked={lease.gst} onChange={(e) => upLease('gst', e.target.checked)} />
          <span className="sm">Rent is plus GST (as applicable under law)</span>
        </label>
        <button className="btn ink full" style={{ marginTop: 14 }} onClick={generateLease}>
          Generate commercial lease
        </button>
      </div>
    </section>
  );
}
