'use client';

import React from 'react';
import { useUI } from './ui-context';
import { useStore } from '@/lib/store';
import { formatInr, formatInrShort, perSqft } from '@/lib/money';
import { cx, copyText, shareUrl } from '@/lib/util';

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

/** Property detail modal — opened from Stock cards and AI match cards. */
export function PropDetail({ id }: { id: string }) {
  const p = useStore((s) => s.properties.find((x) => x.id === id));
  const link = useStore((s) => s.links.find((l) => l.kind === 'single' && l.propId === id));
  const makeSingleLink = useStore((s) => s.makeSingleLink);
  const toggleMarket = useStore((s) => s.toggleMarket);
  const markSold = useStore((s) => s.markSold);
  const toast = useStore((s) => s.toast);
  const { previewSingle, closeModal } = useUI();

  if (!p) return null;

  return (
    <>
      <div style={{ height: 170, background: p.gradient, borderRadius: '20px 20px 0 0', position: 'relative' }}>
        <span className="tagline" style={{ position: 'absolute', top: 14, left: 14, background: 'var(--money)', color: '#fff' }}>
          ● Live
        </span>
      </div>
      <div style={{ padding: 20 }}>
        <div className="price bric tnum" style={{ fontSize: 26 }}>
          {formatInrShort(p.price)}
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, marginTop: 3 }}>{p.title}</div>
        <div className="sm muted">
          📍 {p.area}, Bengaluru · {p.type}
        </div>
        <div className="card" style={{ padding: 14, marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, boxShadow: 'none' }}>
          <Mini v={p.bhk || '—'} l="Bedrooms" />
          <Mini v={p.sqft} l="Sq ft" />
          <Mini v={formatInr(perSqft(p.price, p.sqft))} l="per sqft" />
        </div>

        <label className="field">Shareable link {link ? '' : '(create one)'}</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="urlbox" style={{ flex: 1, margin: 0 }}>
            {link ? shareUrl(link.slug) : '— not shared yet —'}
          </div>
          {link ? (
            <button
              className="btn sm"
              onClick={() => {
                copyText(shareUrl(link.slug));
                toast('Copied ' + shareUrl(link.slug));
              }}
            >
              Copy
            </button>
          ) : (
            <button
              className="btn sm brand"
              onClick={() => {
                makeSingleLink(p.id);
                toast('Link created — see it in Links');
              }}
            >
              Create
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
          <button
            className="btn brand"
            onClick={() => {
              closeModal();
              previewSingle(p.id);
            }}
          >
            Preview as buyer
          </button>
          <button
            className={cx('btn', !p.onMarket && 'ai')}
            onClick={() => {
              const now = toggleMarket(p.id);
              toast(now ? 'Listed on co-broke marketplace — owner kept out-of-band' : 'Removed from marketplace');
            }}
          >
            {p.onMarket ? 'On co-broke ✓' : 'List for co-broking'}
          </button>
          <button
            className="btn"
            onClick={() => {
              markSold(p.id);
              toast('Marked sold — jump to Money to invoice the commission');
              closeModal();
            }}
          >
            Mark sold
          </button>
        </div>
      </div>
    </>
  );
}
