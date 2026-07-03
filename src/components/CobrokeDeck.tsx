'use client';

import { useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import type { CobrokeListing } from '@/lib/types';
import { formatInrShort } from '@/lib/money';

const BROKER_COLORS = ['#2E6EA6', '#0B6B3A', '#7C3AED', '#0E8A9A', '#D97810', '#E8534A'];
const MOCK_BUYERS = ['Vikram Desai', 'Rohit Mehta', 'Anil Kumar', 'Priya Sharma', 'Mohan Reddy'];

function deckMeta(m: CobrokeListing, i: number, clientName?: string) {
  const color = BROKER_COLORS[[...m.broker].reduce((a, c) => a + c.charCodeAt(0), 0) % BROKER_COLORS.length];
  const init = m.broker.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const deals = 18 + (m.score % 40);
  const forClient = clientName || MOCK_BUYERS[i % MOCK_BUYERS.length];
  return { color, init, deals, forClient };
}

const SWIPE_THRESHOLD = 110;

export function CobrokeDeck({ onRequest }: { onRequest: (m: CobrokeListing) => void }) {
  const market = useStore((s) => s.cobrokeMarket);
  const clients = useStore((s) => s.clients);
  const toast = useStore((s) => s.toast);

  const [gone, setGone] = useState<Set<string>>(new Set());
  const [drag, setDrag] = useState({ dx: 0, dy: 0, active: false });
  const [exit, setExit] = useState<{ id: string; dir: 'left' | 'right' | 'save' } | null>(null);
  const start = useRef({ x: 0, y: 0 });

  const remaining = market.filter((m) => !gone.has(m.id));
  const top = remaining[0];

  function decide(dir: 'left' | 'right' | 'save', m: CobrokeListing) {
    if (exit) return;
    setExit({ id: m.id, dir });
    toast(dir === 'right' ? `🤝 Co-broke request sent to ${m.broker}` : dir === 'left' ? 'Skipped' : '★ Saved for later');
    window.setTimeout(() => {
      setGone((g) => new Set(g).add(m.id));
      setExit(null);
      setDrag({ dx: 0, dy: 0, active: false });
      if (dir === 'right') onRequest(m);
    }, 320);
  }

  function onDown(e: React.PointerEvent) {
    if (!top || exit) return;
    start.current = { x: e.clientX, y: e.clientY };
    setDrag({ dx: 0, dy: 0, active: true });
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    if (!drag.active) return;
    setDrag({ dx: e.clientX - start.current.x, dy: e.clientY - start.current.y, active: true });
  }
  function onUp() {
    if (!drag.active || !top) return;
    const { dx } = drag;
    if (dx > SWIPE_THRESHOLD) decide('right', top);
    else if (dx < -SWIPE_THRESHOLD) decide('left', top);
    else setDrag({ dx: 0, dy: 0, active: false });
  }

  if (!top) {
    return (
      <div className="deck-wrap">
        <div className="deck-empty">
          <div className="deck-empty-ic">🎉</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', marginBottom: 6 }}>All caught up!</div>
          <div className="sm" style={{ lineHeight: 1.5 }}>You&apos;ve reviewed every match. New properties matching your buyers appear here daily.</div>
          <button className="btn brand" style={{ marginTop: 16 }} onClick={() => setGone(new Set())}>↺ Replay</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="deck-wrap">
        {remaining.slice(0, 3).map((m, i) => {
          const meta = deckMeta(m, market.indexOf(m), clients[market.indexOf(m)]?.name);
          const isTop = i === 0;
          const isExiting = exit?.id === m.id;
          const dxNow = isTop && drag.active ? drag.dx : 0;

          let transform: string;
          let transition: string;
          if (isExiting) {
            const x = exit.dir === 'right' ? 600 : exit.dir === 'left' ? -600 : 0;
            const y = exit.dir === 'save' ? -700 : 80;
            const rot = exit.dir === 'right' ? 40 : exit.dir === 'left' ? -40 : 0;
            transform = `translate(${x}px,${y}px) rotate(${rot}deg)`;
            transition = 'transform .35s cubic-bezier(.2,.8,.2,1), opacity .35s';
          } else if (isTop && drag.active) {
            transform = `translate(${drag.dx}px,${drag.dy}px) rotate(${drag.dx * 0.06}deg)`;
            transition = 'none';
          } else {
            const depth = Math.min(i, 2);
            transform = `translateY(${depth * 12}px) scale(${1 - depth * 0.04})`;
            transition = 'transform .3s cubic-bezier(.2,.8,.2,1)';
          }

          const likeOp = isExiting ? (exit.dir === 'right' ? 1 : 0) : dxNow > 0 ? Math.min(dxNow / 100, 1) : 0;
          const nopeOp = isExiting ? (exit.dir === 'left' ? 1 : 0) : dxNow < 0 ? Math.min(-dxNow / 100, 1) : 0;

          return (
            <div
              key={m.id}
              className="swipe-card"
              style={{ transform, transition, opacity: isExiting ? 0 : i > 2 ? 0 : 1, zIndex: remaining.length - i }}
              onPointerDown={isTop ? onDown : undefined}
              onPointerMove={isTop ? onMove : undefined}
              onPointerUp={isTop ? onUp : undefined}
              onPointerCancel={isTop ? onUp : undefined}
            >
              <div className="sc-img" style={{ background: m.gradient }}>
                <div className="sc-match">{m.score}% match</div>
                <div className="sc-stamp like" style={{ opacity: likeOp }}>REQUEST</div>
                <div className="sc-stamp nope" style={{ opacity: nopeOp }}>SKIP</div>
              </div>
              <div className="sc-body">
                <div className="sc-name">{m.title}</div>
                <div className="sc-loc">📍 {m.area} · {m.sqft.toLocaleString('en-IN')} sqft · {m.price ? formatInrShort(m.price) : formatInrShort(m.rent || 0) + '/mo'}</div>
                <div className="sc-broker">
                  <div className="avatar" style={{ width: 36, height: 36, fontSize: 13, background: meta.color }}>{meta.init}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{m.broker}</div>
                    <div className="tiny muted">{meta.deals} deals · ★{(m.score / 20).toFixed(1)}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div className="tiny muted">For your client</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)' }}>{meta.forClient}</div>
                  </div>
                </div>
                <div className="sc-split">
                  <div className="tiny muted" style={{ marginBottom: 5 }}>Commission split offered</div>
                  <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${m.split}%`, background: 'var(--ink)' }} />
                    <div style={{ width: `${100 - m.split}%`, background: 'var(--brand)' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }} className="tiny muted">
                    <span>You {m.split}%</span>
                    <span>{m.broker.split(' ')[0]} {100 - m.split}%</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="deck-actions">
        <button className="deck-btn nope" onClick={() => top && decide('left', top)} aria-label="Skip">✕</button>
        <button className="deck-btn save" onClick={() => top && decide('save', top)} aria-label="Save">★</button>
        <button className="deck-btn like" onClick={() => top && decide('right', top)} aria-label="Send co-broke request">🤝</button>
      </div>
      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink2)', marginTop: 14 }}>
        ✕ Skip · ★ Save for later · 🤝 Send co-broke request
      </div>
    </>
  );
}
