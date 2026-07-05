'use client';

import { useUI } from './ui-context';
import { useStore, type Screen } from '@/lib/store';
import { activeBroker } from '@/lib/broker';
import { cx } from '@/lib/util';

const TABS: { s: Screen; label: string }[] = [
  { s: 'home', label: 'Home' },
  { s: 'inbox', label: 'Inbox' },
  { s: 'stock', label: 'Stock' },
  { s: 'clients', label: 'Clients' },
  { s: 'cobroke', label: 'Co-broke' },
  { s: 'links', label: 'Links' },
  { s: 'leads', label: 'Leads' },
  { s: 'money', label: 'Money' },
  { s: 'lawyer', label: 'Lawyer' },
  { s: 'brand', label: 'Brand' },
  { s: 'marketing', label: 'Marketing' },
  { s: 'pulse', label: 'Pulse' },
];

export function Shell({ onLogout }: { onLogout?: () => void }) {
  const { screen, nav } = useUI();
  const unread = useStore((s) => s.conversations.reduce((a, c) => a + c.unread, 0));
  const broker = activeBroker();

  return (
    <div className="topnav">
      <div className="inner">
        <div className="logo">b</div>
        <div className="brandname">Brokly</div>
        <div className="tabs">
          {TABS.map((t) => (
            <button key={t.s} className={cx('tab', screen === t.s && 'on')} onClick={() => nav(t.s)}>
              {t.label}
              {t.s === 'inbox' && unread > 0 && <span className="dot" />}
            </button>
          ))}
        </div>
        <div className="who">
          <div
            className="avatar"
            title={`${broker.name} — click to log out`}
            style={{ cursor: onLogout ? 'pointer' : 'default' }}
            onClick={() => {
              if (onLogout && window.confirm('Log out of Brokly?')) onLogout();
            }}
          >
            {broker.initials}
          </div>
        </div>
      </div>
    </div>
  );
}
