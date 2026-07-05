'use client';

import { useState } from 'react';
import { formatInr, formatInrShort, perSqft, bpsOf } from '@/lib/money';
import { activeBroker, initialsOf } from '@/lib/broker';

/** The broker identity shown on the buyer-facing card. Public link pages pass
 *  the identity stored on the link; in-app previews default to the active broker. */
export interface BuyerBroker {
  name: string;
  initials: string;
  score: number;
  city: string;
}

export function buyerBrokerFrom(name: string, score: number): BuyerBroker {
  return { name, initials: initialsOf(name), score, city: 'Bengaluru' };
}

// Minimal shape shared by the client store's Property and the server link payload.
export interface BuyerProp {
  id: string;
  title: string;
  area: string;
  type: string;
  bhk: number;
  sqft: number;
  price: number; // paise
  gradient: string;
  isNew?: boolean; // just added on the latest auto-update
}

export interface EnquiryInput {
  name: string;
  phone: string;
  msg: string;
}

export function BuyerHeader({
  preview,
  sharedBy,
  title,
  subtitle,
  onClose,
}: {
  preview: boolean;
  sharedBy: string;
  title: string;
  subtitle: string;
  onClose?: () => void;
}) {
  return (
    <div className="buyer-top">
      {onClose && (
        <button className="closex" onClick={onClose} style={{ background: 'rgba(255,255,255,.25)', color: '#fff' }}>
          ✕
        </button>
      )}
      <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 600 }}>
        {preview ? 'PREVIEW · what your client sees' : `SHARED BY ${sharedBy.toUpperCase()}`}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }} className="bric">
        {title}
      </div>
      <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>{subtitle}</div>
    </div>
  );
}

export function BuyerCard({ p, score, onOpen }: { p: BuyerProp; score?: number; onOpen: () => void }) {
  return (
    <div className="card" style={{ overflow: 'hidden', marginBottom: 12, cursor: 'pointer' }} onClick={onOpen}>
      <div style={{ height: 140, background: p.gradient, position: 'relative' }}>
        {score != null && (
          <span className="tagline" style={{ position: 'absolute', top: 10, left: 10, background: 'var(--money)', color: '#fff' }}>
            {score}% for you
          </span>
        )}
        {p.isNew && (
          <span className="tagline" style={{ position: 'absolute', top: 10, right: 10, background: 'var(--gold)', color: '#fff' }}>
            ✦ NEW
          </span>
        )}
      </div>
      <div style={{ padding: 13 }}>
        <div className="price bric tnum">{formatInrShort(p.price)}</div>
        <div style={{ fontWeight: 600, marginTop: 3 }}>{p.title}</div>
        <div className="spec">
          <span>📍 {p.area}</span>
          <span>{p.bhk ? p.bhk + ' BHK' : p.type}</span>
          <span>◧ {p.sqft} sqft</span>
        </div>
      </div>
    </div>
  );
}

function Mini({ v, l }: { v: React.ReactNode; l: string }) {
  return (
    <div>
      <div className="bric tnum" style={{ fontSize: 18, fontWeight: 700 }}>
        {v}
      </div>
      <div className="tiny muted">{l}</div>
    </div>
  );
}

export function BuyerDetail({
  p,
  broker,
  onBack,
  onClose,
  onEnquire,
}: {
  p: BuyerProp;
  broker?: BuyerBroker;
  onBack?: () => void;
  onClose?: () => void;
  onEnquire: () => void;
}) {
  const b = broker ?? activeBroker();
  const sd = bpsOf(p.price, 500);
  const reg = bpsOf(p.price, 100);
  const cess = bpsOf(sd, 1000);
  const total = sd + reg + cess;

  return (
    <>
      <div style={{ position: 'relative' }}>
        <div style={{ height: 230, background: p.gradient }} />
        {onBack && (
          <button className="closex" style={{ left: 14, right: 'auto', top: 40 }} onClick={onBack}>
            ‹
          </button>
        )}
        {onClose && (
          <button className="closex" style={{ top: 40 }} onClick={onClose}>
            ✕
          </button>
        )}
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <span className="tagline" style={{ background: 'var(--moneySoft)', color: 'var(--money)' }}>
            For sale
          </span>
          <span className="tagline" style={{ background: 'var(--line)', color: 'var(--ink2)' }}>
            {p.type}
          </span>
        </div>
        <div className="price bric tnum" style={{ fontSize: 26 }}>
          {formatInrShort(p.price)}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink2)' }} className="tnum">
          {formatInr(perSqft(p.price, p.sqft))}/sqft · negotiable
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, marginTop: 8 }}>{p.title}</div>
        <div className="sm muted">📍 {p.area}, {b.city}</div>

        <div className="card" style={{ padding: 14, marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Mini v={p.bhk} l="Bedrooms" />
          <Mini v={p.sqft} l="Sq ft" />
          <Mini v={2} l="Car parks" />
          <Mini v="East" l="Facing" />
        </div>

        <div className="card" style={{ padding: 14, marginTop: 12, background: 'linear-gradient(135deg,#171033,#5B3BE0)', color: '#fff', border: 'none' }}>
          <div className="tiny" style={{ fontWeight: 700, opacity: 0.8, letterSpacing: '.05em' }}>
            ✦ AI PRICE CHECK
          </div>
          <div style={{ fontWeight: 700, marginTop: 6 }}>Fairly priced for {p.area}</div>
          <div className="tiny" style={{ opacity: 0.9, marginTop: 3 }}>
            Recent sales here ran {formatInr(perSqft(p.price, p.sqft) - 70000)}–{formatInr(perSqft(p.price, p.sqft) + 60000)}/sqft. This sits mid-band.
          </div>
        </div>

        <div className="card" style={{ padding: 14, marginTop: 12 }}>
          <b style={{ fontSize: 14 }}>Stamp duty estimate</b>
          <div className="inv-line">
            <span className="muted">Stamp duty (5%)</span>
            <b className="tnum">{formatInr(sd)}</b>
          </div>
          <div className="inv-line" style={{ border: 'none' }}>
            <span className="muted">Reg + cess</span>
            <b className="tnum">{formatInr(reg + cess)}</b>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <b>Total</b>
            <b className="tnum" style={{ color: 'var(--brand)' }}>
              {formatInr(total)}
            </b>
          </div>
        </div>

        <div className="card" style={{ padding: 14, marginTop: 12, background: 'var(--brand)', color: '#fff', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {b.initials}
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>{b.name}</div>
              <div className="tiny">
                <span style={{ background: 'rgba(255,255,255,.2)', padding: '2px 7px', borderRadius: 6 }}>
                  ★ Brokly Score {b.score}
                </span>
              </div>
            </div>
          </div>
          <button className="btn full" style={{ marginTop: 12, background: '#fff', color: 'var(--brandD)', border: 'none' }} onClick={onEnquire}>
            I&apos;m interested — enquire
          </button>
        </div>
      </div>
    </>
  );
}

export function EnquiryForm({
  title,
  onClose,
  onSubmit,
}: {
  title: string;
  onClose: () => void;
  onSubmit: (e: EnquiryInput) => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(14,31,24,.5)', display: 'flex', alignItems: 'flex-end', zIndex: 10 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: 20, width: '100%' }}>
        <b style={{ fontSize: 16 }}>Enquire · {title}</b>
        <input className="in" placeholder="Your name" style={{ marginTop: 10 }} value={name} onChange={(e) => setName(e.target.value)} />
        <input className="in" placeholder="Phone (9198xxxxxxx)" inputMode="numeric" style={{ marginTop: 8 }} value={phone} onChange={(e) => setPhone(e.target.value)} />
        <textarea
          className="in"
          rows={2}
          placeholder="e.g. Can I visit this weekend? Is parking included?"
          style={{ marginTop: 8 }}
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
        />
        <button className="btn brand full" style={{ marginTop: 10 }} onClick={() => onSubmit({ name, phone, msg })}>
          Send enquiry
        </button>
      </div>
    </div>
  );
}
