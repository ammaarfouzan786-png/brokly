'use client';

import { useUI } from '../ui-context';
import { useStore } from '@/lib/store';
import type { ShareLink } from '@/lib/types';
import { strongMatches } from '@/lib/matching';
import { copyText, shareUrl } from '@/lib/util';

export function Links() {
  const links = useStore((s) => s.links);
  const properties = useStore((s) => s.properties);
  const clients = useStore((s) => s.clients);
  const simulateNewStock = useStore((s) => s.simulateNewStock);
  const toast = useStore((s) => s.toast);
  const { openBuyerLink } = useUI();

  const countFor = (l: ShareLink): number => {
    if (l.kind !== 'collection') return 1;
    const req = clients.find((c) => c.id === l.clientId);
    return req ? strongMatches(properties, req).length : 0;
  };

  return (
    <section className="screen">
      <div className="h1">Shareable links</div>
      <div className="sub">Every link you share, in one place. Views, enquiries, and exactly what your client sees.</div>

      <div className="sectionh">
        Your links <span className="tiny muted">{links.length} active</span>
      </div>
      <div className="card">
        {links.length ? (
          links.map((l) => {
            const count = countFor(l);
            const ico =
              l.kind === 'collection'
                ? ['var(--goldSoft)', 'var(--gold)', '◳']
                : ['var(--blueSoft)', 'var(--blue)', '◰'];
            return (
              <div className="linkrow" key={l.id}>
                <div className="linkico" style={{ background: ico[0], color: ico[1] }}>
                  {ico[2]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <b>{l.label}</b>
                    <span className="pill" style={{ background: ico[0], color: ico[1] }}>
                      {l.kind === 'collection' ? 'Smart collection · ' + count + ' homes' : 'Single property'}
                    </span>
                  </div>
                  <div className="urlbox">{shareUrl(l.slug)}</div>
                  <div className="sm muted" style={{ marginTop: 6 }}>
                    👁 {l.views} views · 💬 {l.enquiries} enquiries{l.kind === 'collection' ? ' · auto-updates' : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button className="btn sm brand" onClick={() => openBuyerLink(l, false)}>
                    Open as buyer
                  </button>
                  <button
                    className="btn sm"
                    onClick={() => {
                      copyText(shareUrl(l.slug));
                      toast('Copied ' + shareUrl(l.slug));
                    }}
                  >
                    Copy link
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty">No links yet. Match a client or share a property.</div>
        )}
      </div>

      <div className="card" style={{ padding: 16, marginTop: 16, background: 'var(--aiSoft)', borderColor: '#DAD2FB' }}>
        <b style={{ color: 'var(--ai)' }}>How &quot;smart collection&quot; links keep updating</b>
        <div className="sm" style={{ margin: '6px 0 12px', lineHeight: 1.5 }}>
          A collection link is tied to a client&apos;s brief, not a fixed list. Add stock that matches and it appears in
          their link automatically.
        </div>
        <button
          className="btn ai sm"
          onClick={() => {
            const name = simulateNewStock();
            if (name) toast('New matching home listed → ' + name + "'s link updated automatically");
            else toast('Create a smart collection link first (Clients → match → create link)');
          }}
        >
          ▶ Simulate: a new matching property gets listed
        </button>
      </div>
    </section>
  );
}
