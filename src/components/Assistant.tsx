'use client';

import { useEffect, useRef, useState } from 'react';
import { useUI } from './ui-context';
import { useStore, type Screen } from '@/lib/store';
import { rankProperties } from '@/lib/matching';
import { formatInr, formatInrShort, rupees, bpsOf, pctToBps } from '@/lib/money';

type Item = { kind: 'msg'; me: boolean; html: string } | { kind: 'chips'; chips: string[] };

const esc = (s: string) => (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const CHIP_NAV: Record<string, Screen> = {
  'Open Leads': 'leads',
  'Open Clients': 'clients',
  'Open Lawyer': 'lawyer',
  'Open Money': 'money',
  'Open Inbox': 'inbox',
  'Open Co-broke': 'cobroke',
};

export function Assistant() {
  const { toggleAssistant, nav } = useUI();
  const [items, setItems] = useState<Item[]>([]);
  const [text, setText] = useState('');
  const msgsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setItems([
      {
        kind: 'msg',
        me: false,
        html: 'Hi Ammar 👋 I can see your stock, leads, clients and co-broke deals. Try:',
      },
      { kind: 'chips', chips: ['Which leads are hot?', 'Match Rajesh', 'Stamp duty on 1.5cr', 'Draft a WhatsApp for the Whitefield 3BHK'] },
    ]);
  }, []);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = 9e9;
  }, [items]);

  function push(me: boolean, html: string) {
    setItems((x) => [...x, { kind: 'msg', me, html }]);
  }
  function pushChips(chips: string[]) {
    setItems((x) => [...x, { kind: 'chips', chips }]);
  }

  function reply(q: string) {
    const { leads, clients, properties, cobrokeMarket } = useStore.getState();
    const t = q.toLowerCase();

    if (/hot/.test(t) && /lead/.test(t)) {
      const h = leads.filter((l) => l.temp === 'HOT');
      push(
        false,
        h.length
          ? `You have <b>${h.length} hot lead(s)</b>:<br>` + h.map((l) => `• ${esc(l.name)} (AI ${l.score}) — "${esc(l.msg)}"`).join('<br>')
          : 'No hot leads right now.',
      );
      pushChips(['Open Leads']);
      return;
    }
    if (/match\b/.test(t)) {
      const nm = q.replace(/.*match/i, '').trim().toLowerCase();
      const c = clients.find((x) => x.name.toLowerCase().includes(nm)) || clients[0];
      if (c) {
        const ranked = rankProperties(properties, c).slice(0, 3);
        push(
          false,
          `Top matches for <b>${esc(c.name)}</b> (${c.type}, ${c.area}):<br>` +
            ranked.map((m) => `• ${esc(m.p.title)} — <b>${m.score}%</b>`).join('<br>'),
        );
        pushChips(['Open Clients']);
      } else {
        push(false, 'Add a client first in the Clients tab.');
      }
      return;
    }
    if (/stamp/.test(t)) {
      const m = t.match(/([\d.]+)\s*(cr|crore|l|lakh)?/);
      let rup = 0;
      if (m) {
        rup = parseFloat(m[1]);
        if (/cr/.test(m[2] || '')) rup *= 1e7;
        else if (/l/.test(m[2] || '')) rup *= 1e5;
      }
      if (!rup) rup = 15000000;
      const vp = rupees(rup);
      const stamp = bpsOf(vp, 500);
      const cess = bpsOf(vp, 50);
      const reg = bpsOf(vp, 100);
      push(
        false,
        `On <b>${formatInrShort(vp)}</b> (Karnataka sale):<br>• Stamp duty 5% — ${formatInr(stamp)}<br>• Cess 0.5% — ${formatInr(cess)}<br>• Registration 1% — ${formatInr(reg)}<br><b>Total ${formatInr(stamp + cess + reg)}</b>`,
      );
      pushChips(['Open Lawyer']);
      return;
    }
    if (/commission/.test(t)) {
      const nums = (t.match(/[\d.]+/g) || []).map(Number);
      let rup = nums[0] || 15000000;
      if (rup < 100) rup *= 1e7;
      const rate = nums[1] || 1;
      const vp = rupees(rup);
      const gross = bpsOf(vp, pctToBps(rate));
      const withGst = gross + bpsOf(gross, 1800);
      push(false, `Commission on <b>${formatInrShort(vp)}</b> @ ${rate}%: <b>${formatInr(gross)}</b> (+18% GST = ${formatInr(withGst)})`);
      pushChips(['Open Money']);
      return;
    }
    if (/draft|reply|whatsapp|message/.test(t)) {
      push(
        false,
        `Here's a draft you can send:<br><i>"Hi! Thanks for your interest in the Whitefield 3BHK (₹1.45 Cr). It's a bright east-facing home with 2 covered parks. I can arrange a visit this weekend — does Saturday 11am work? — Ammar"</i>`,
      );
      pushChips(['Open Inbox']);
      return;
    }
    if (/co-?broke|cobroke/.test(t)) {
      if (cobrokeMarket.length) {
        const best = [...cobrokeMarket].sort((a, b) => b.split - a.split)[0];
        push(false, `There are <b>${cobrokeMarket.length} co-broke listings</b> open. Best split: ${best.split}% on ${esc(best.title)}.`);
        pushChips(['Open Co-broke']);
      } else {
        push(false, 'No co-broke listings open right now.');
      }
      return;
    }
    if (/help|what can|^hi$|hello|hey/.test(t)) {
      push(false, 'I work off your live data. Ask me to find hot leads, match a client, calculate stamp duty or commission, draft a WhatsApp, or summarise co-broke options.');
      return;
    }
    push(false, 'I can help with leads, matching, stamp duty, commission, co-broke and drafting messages. Try one of these:');
    pushChips(['Which leads are hot?', 'Match Rajesh', 'Co-broke options']);
  }

  function send(preset?: string) {
    const q = (preset ?? text).trim();
    if (!q) return;
    push(true, esc(q));
    setText('');
    setTimeout(() => reply(q), 250);
  }

  function onChip(chip: string) {
    if (CHIP_NAV[chip]) {
      nav(CHIP_NAV[chip]);
      toggleAssistant();
      return;
    }
    send(chip);
  }

  return (
    <div className="asst">
      <div className="ahead">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700 }}>Brokly AI</div>
            <div className="tiny" style={{ opacity: 0.85 }}>
              Knows your stock, leads &amp; clients
            </div>
          </div>
          <button onClick={toggleAssistant} style={{ background: 'rgba(255,255,255,.2)', border: 'none', color: '#fff', width: 28, height: 28, borderRadius: 8 }}>
            ✕
          </button>
        </div>
      </div>
      <div className="amsgs" ref={msgsRef}>
        {items.map((it, i) =>
          it.kind === 'msg' ? (
            <div
              key={i}
              className={`bub ${it.me ? 'me' : 'them'}`}
              style={it.me ? undefined : { background: '#fff', border: '1px solid var(--line)' }}
              dangerouslySetInnerHTML={{ __html: it.html }}
            />
          ) : (
            <div key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {it.chips.map((c) => (
                <button key={c} className="sgchip" onClick={() => onChip(c)}>
                  {c}
                </button>
              ))}
            </div>
          ),
        )}
      </div>
      <div className="composer">
        <input
          className="in"
          placeholder="Ask anything…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send();
          }}
        />
        <button className="btn ai" onClick={() => send()}>
          Send
        </button>
      </div>
    </div>
  );
}
