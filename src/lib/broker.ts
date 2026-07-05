// Who is the logged-in broker? Single source of truth for name/agency/initials
// everywhere the app speaks as the broker (greeting, avatar, buyer links,
// WhatsApp copy, deed drafts).
//
// Prefers the onboarded profile saved by Onboarding (see broker-profile.ts) and
// falls back to the demo seed broker so the app renders before onboarding and
// on the server. Safe to import from server code: on the server there is no
// localStorage, so callers simply get the seed broker.

import { BROKER } from './seed';

/** localStorage key for the onboarded profile — shared with broker-profile.ts. */
export const BROKER_STORAGE_KEY = 'brokly-broker';

export interface ActiveBroker {
  name: string;
  initials: string;
  agency: string;
  city: string;
  area: string;
  score: number;
  gstin: string;
  email?: string;
  phone?: string;
  rera?: string;
}

export function initialsOf(name: string): string {
  return (
    (name || '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => (w[0] || '').toUpperCase())
      .join('') || 'B'
  );
}

export function activeBroker(): ActiveBroker {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(BROKER_STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as {
          name?: string; agency?: string; brokerScore?: number;
          email?: string; phone?: string; rera?: string;
        };
        if (p?.name) {
          return {
            name: p.name,
            initials: initialsOf(p.name),
            agency: (p.agency || '').trim() || p.name,
            city: BROKER.city,
            area: BROKER.area,
            score: p.brokerScore || BROKER.score,
            gstin: BROKER.gstin,
            email: p.email,
            phone: p.phone,
            rera: p.rera,
          };
        }
      }
    } catch {
      // corrupt profile — fall back to the seed broker
    }
  }
  return { ...BROKER };
}
