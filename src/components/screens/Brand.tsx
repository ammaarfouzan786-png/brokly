'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { cx } from '@/lib/util';
import { activeBroker } from '@/lib/broker';

const COLORS = ['#0B6B3A', '#06472A', '#171033', '#C98A15', '#2E72D2', '#0E1F18', '#B5314A', '#1F7A8C'];
type Shape = 'rounded' | 'circle' | 'shield';
type Style = 'bric' | 'inter';
type BrandTab = 'logo' | 'card' | 'avatar';

const esc = (s: string) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function shade(hex: string, pct: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const t = pct < 0 ? 0 : 255;
  const p = Math.abs(pct) / 100;
  r = Math.round((t - r) * p) + r;
  g = Math.round((t - g) * p) + g;
  b = Math.round((t - b) * p) + b;
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function markSVG(shape: Shape, color: string) {
  if (shape === 'circle') return `<circle cx="32" cy="32" r="32" fill="${color}"/>`;
  if (shape === 'shield') return `<path d="M32 0 L64 12 V36 C64 52 50 62 32 64 C14 62 0 52 0 36 V12 Z" fill="${color}"/>`;
  return `<rect x="0" y="0" width="64" height="64" rx="16" fill="${color}"/>`;
}

interface Kit { name: string; tag: string; person: string; phone: string; email: string; rera: string; shape: Shape; color: string; style: Style }

function logoSVG(o: Kit) {
  const initial = (o.name.trim()[0] || 'B').toUpperCase();
  const font = o.style === 'bric' ? 'Bricolage Grotesque, sans-serif' : 'Inter, sans-serif';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="80" viewBox="0 0 320 80"><g transform="translate(8,8)">${markSVG(o.shape, o.color)}<text x="32" y="33" font-family="${font}" font-size="34" font-weight="800" fill="#fff" text-anchor="middle" dominant-baseline="central">${initial}</text></g><text x="86" y="${o.tag ? 34 : 46}" font-family="${font}" font-size="28" font-weight="800" fill="${o.color}">${esc(o.name)}</text>${o.tag ? `<text x="88" y="56" font-family="Inter,sans-serif" font-size="12" font-weight="500" fill="#56655E" letter-spacing="1">${esc(o.tag.toUpperCase())}</text>` : ''}</svg>`;
}

function cardSVG(o: Kit) {
  const font = o.style === 'bric' ? 'Bricolage Grotesque, sans-serif' : 'Inter, sans-serif';
  const initial = (o.name.trim()[0] || 'B').toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="400" viewBox="0 0 700 400">
  <rect x="1" y="1" width="698" height="398" rx="18" fill="#ffffff" stroke="#E5EBE7"/>
  <path d="M0 18 A18 18 0 0 1 18 0 H220 V400 H18 A18 18 0 0 1 0 382 Z" fill="${o.color}"/>
  <g transform="translate(60,150)"><rect width="100" height="100" rx="26" fill="rgba(255,255,255,.16)"/><text x="50" y="54" font-family="${font}" font-size="54" font-weight="800" fill="#fff" text-anchor="middle" dominant-baseline="central">${initial}</text></g>
  <text x="270" y="118" font-family="${font}" font-size="34" font-weight="800" fill="#0E1F18">${esc(o.name)}</text>
  <text x="271" y="146" font-family="Inter,sans-serif" font-size="12" font-weight="600" fill="#8A968F" letter-spacing="2">${esc((o.tag || '').toUpperCase())}</text>
  <line x1="270" y1="172" x2="650" y2="172" stroke="#E5EBE7"/>
  <text x="270" y="222" font-family="Inter,sans-serif" font-size="21" font-weight="700" fill="#0E1F18">${esc(o.person)}</text>
  <text x="270" y="247" font-family="Inter,sans-serif" font-size="13" fill="#56655E">Real Estate Consultant</text>
  <text x="270" y="298" font-family="Inter,sans-serif" font-size="14" fill="#0E1F18">Tel   ${esc(o.phone)}</text>
  <text x="270" y="324" font-family="Inter,sans-serif" font-size="14" fill="#0E1F18">Email ${esc(o.email)}</text>
  ${o.rera ? `<text x="270" y="350" font-family="Inter,sans-serif" font-size="12" fill="#8A968F">RERA  ${esc(o.rera)}</text>` : ''}
</svg>`;
}

function avatarSVG(o: Kit) {
  const font = o.style === 'bric' ? 'Bricolage Grotesque, sans-serif' : 'Inter, sans-serif';
  const initial = (o.name.trim()[0] || 'B').toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${o.color}"/><stop offset="1" stop-color="${shade(o.color, -25)}"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><text x="200" y="205" font-family="${font}" font-size="200" font-weight="800" fill="#fff" text-anchor="middle" dominant-baseline="central">${initial}</text><text x="200" y="350" font-family="Inter,sans-serif" font-size="24" font-weight="600" fill="rgba(255,255,255,.85)" text-anchor="middle">${esc(o.name)}</text></svg>`;
}

export function Brand() {
  const toast = useStore((s) => s.toast);
  const [tab, setTab] = useState<BrandTab>('logo');
  const [kit, setKit] = useState<Kit>(() => {
    const b = activeBroker();
    return {
      name: b.agency,
      tag: `${b.city} real estate`,
      person: b.name,
      phone: b.phone ? `+${b.phone.replace(/^\+/, '')}` : '+91 98765 43210',
      email: b.email || `hello@${b.agency.toLowerCase().replace(/[^a-z0-9]/g, '')}.in`,
      rera: b.rera || 'PRM/KA/RERA/1251',
      shape: 'rounded',
      color: COLORS[0],
      style: 'bric',
    };
  });
  const up = (k: keyof Kit, v: string) => setKit((o) => ({ ...o, [k]: v }));

  const svg = tab === 'card' ? cardSVG(kit) : tab === 'avatar' ? avatarSVG(kit) : logoSVG(kit);
  const palette = [shade(kit.color, -30), kit.color, shade(kit.color, 30), shade(kit.color, 60), '#0E1F18', '#56655E'];

  function download() {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (kit.name || 'brand').replace(/\s+/g, '-').toLowerCase() + '-' + tab + '.svg';
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast(`${tab === 'card' ? 'Business card' : tab === 'avatar' ? 'Profile picture' : 'Logo'} downloaded ✓`);
  }

  return (
    <section className="screen">
      <div className="h1">Brand kit</div>
      <div className="sub">Logo, business card, social profile picture and colour palette — preview live, download the SVG.</div>

      <div className="grid" style={{ gridTemplateColumns: '1fr', marginTop: 16, maxWidth: 620 }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>
            {([['logo', '✦ Logo'], ['card', '💳 Business card'], ['avatar', '🟢 Profile pic']] as [BrandTab, string][]).map(([t, l]) => (
              <button key={t} className={cx('chip', tab === t && 'active')} onClick={() => setTab(t)}>{l}</button>
            ))}
          </div>

          <div className="row2">
            <div><label className="field">Brand / agency name</label><input className="in" value={kit.name} onChange={(e) => up('name', e.target.value)} /></div>
            <div><label className="field">Tagline</label><input className="in" value={kit.tag} onChange={(e) => up('tag', e.target.value)} /></div>
          </div>

          {tab === 'card' && (
            <div className="row2">
              <div><label className="field">Your name</label><input className="in" value={kit.person} onChange={(e) => up('person', e.target.value)} /></div>
              <div><label className="field">Phone</label><input className="in" value={kit.phone} onChange={(e) => up('phone', e.target.value)} /></div>
              <div><label className="field">Email</label><input className="in" value={kit.email} onChange={(e) => up('email', e.target.value)} /></div>
              <div><label className="field">RERA no.</label><input className="in" value={kit.rera} onChange={(e) => up('rera', e.target.value)} /></div>
            </div>
          )}

          <label className="field">Mark shape</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['rounded', 'circle', 'shield'] as Shape[]).map((sh) => (
              <button key={sh} className={cx('btn sm', kit.shape === sh && 'ink')} onClick={() => up('shape', sh)}>{sh[0].toUpperCase() + sh.slice(1)}</button>
            ))}
          </div>

          <label className="field">Colour</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLORS.map((c) => (
              <div key={c} className={cx('swatch', kit.color === c && 'on')} style={{ background: c }} onClick={() => up('color', c)} />
            ))}
          </div>

          <label className="field">Style</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={cx('btn sm', kit.style === 'bric' && 'ink')} onClick={() => up('style', 'bric')}>Bold display</button>
            <button className={cx('btn sm', kit.style === 'inter' && 'ink')} onClick={() => up('style', 'inter')}>Clean sans</button>
          </div>

          <div className="logo-preview" style={{ marginTop: 16, height: tab === 'logo' ? 200 : 'auto', padding: tab === 'logo' ? 0 : 16 }} dangerouslySetInnerHTML={{ __html: svg }} />

          <label className="field">Colour palette</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {palette.map((c) => (
              <div key={c} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ height: 40, borderRadius: 8, background: c, border: '1px solid var(--line)' }} title={c} onClick={() => toast('Copied ' + c)} />
                <div className="tiny muted" style={{ marginTop: 3, fontSize: 9 }}>{c}</div>
              </div>
            ))}
          </div>

          <button className="btn ink full" style={{ marginTop: 16 }} onClick={download}>
            Download {tab === 'card' ? 'business card' : tab === 'avatar' ? 'profile picture' : 'logo'} (SVG)
          </button>
        </div>
      </div>
    </section>
  );
}
