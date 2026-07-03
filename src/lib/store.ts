'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Property,
  ClientReq,
  ShareLink,
  Lead,
  Invoice,
  Conversation,
  CobrokeListing,
  PropertyType,
  Urgency,
} from './types';
import { commission } from './commission';
import { strongMatches } from './matching';
import { uid, randomGradient, digits, shareUrl } from './util';
import { firstContactMessages, linkUpdatedMessage, briefFromClient } from './messages';
import {
  seedProperties,
  seedClients,
  seedLeads,
  seedConversations,
  seedCobroke,
  BROKER,
} from './seed';

export type Screen =
  | 'home' | 'inbox' | 'stock' | 'clients' | 'cobroke'
  | 'links' | 'leads' | 'money' | 'lawyer' | 'brand'
  | 'marketing' | 'pulse';

export type LeadFilter = 'all' | 'HOT' | 'WARM';

interface NewProperty {
  title: string; type: PropertyType; area: string;
  bhk: number; sqft: number; price: number; // price in paise
}
interface NewReq {
  name: string; phone: string; type: PropertyType; bhk: number;
  area: string; min: number; max: number; urg: Urgency; // paise
}
interface InboundMsg { from: string; name?: string; text: string; waId?: string; ts?: number; }
interface IncomingEnquiry { slug: string; propId: string; propTitle?: string; name?: string; phone?: string; msg?: string; }

interface BroklyState {
  // domain
  properties: Property[];
  clients: ClientReq[];
  links: ShareLink[];
  leads: Lead[];
  invoices: Invoice[];
  conversations: Conversation[];
  cobrokeMarket: CobrokeListing[];
  myCobroke: CobrokeListing[];
  lastMatchClientId: string | null;
  leadFilter: LeadFilter;
  waCursor: number;
  enqCursor: number;

  // ui
  toastMsg: string;
  toast: (m: string) => void;

  // property actions
  addProperty: (p: NewProperty) => void;
  toggleMarket: (id: string) => boolean;
  markSold: (id: string) => void;

  // client / matching
  runMatch: (r: NewReq) => ClientReq;
  rematch: (clientId: string) => void;

  // links
  makeSingleLink: (propId: string) => ShareLink | null;
  makeCollectionLink: () => ShareLink | null;
  registerView: (linkId: string) => void;
  simulateNewStock: () => string | null;
  publishLink: (link: ShareLink, opts?: { newPropId?: string }) => void;
  ingestEnquiries: (items: IncomingEnquiry[], cursor: number) => void;

  // co-broke
  requestCobroke: (id: string) => void;
  acceptCobroke: (id: string) => CobrokeListing | null;

  // inbox / whatsapp
  markRead: (convId: string) => void;
  appendOutgoing: (convId: string, text: string) => void;
  sendWhatsApp: (convId: string, text: string) => Promise<{ live: boolean }>;
  ingestInbound: (items: InboundMsg[], cursor: number) => void;

  // leads
  addEnquiry: (a: { propId: string; linkId?: string | null; name: string; phone: string; msg: string }) => number;
  setLeadFilter: (f: LeadFilter) => void;

  // money
  genInvoice: (a: { propId: string; title: string; client: string; value: number; rate: number; cobroke: boolean; split: number }) => Invoice;
  advanceInvoice: (id: string) => void;

  reset: () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useStore = create<BroklyState>()(
  persist(
    (set, get) => ({
      properties: seedProperties(),
      clients: seedClients(),
      links: [],
      leads: seedLeads(),
      invoices: [],
      conversations: seedConversations(),
      cobrokeMarket: seedCobroke(),
      myCobroke: [],
      lastMatchClientId: null,
      leadFilter: 'all',
      waCursor: 0,
      enqCursor: 0,

      toastMsg: '',
      toast: (m) => {
        set({ toastMsg: m });
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => set({ toastMsg: '' }), 2400);
      },

      addProperty: (p) =>
        set((s) => ({
          properties: [
            { id: uid('p'), gradient: randomGradient(), onMarket: false, ...p },
            ...s.properties,
          ],
        })),

      toggleMarket: (id) => {
        let now = false;
        set((s) => ({
          properties: s.properties.map((p) => {
            if (p.id !== id) return p;
            now = !p.onMarket;
            return { ...p, onMarket: now };
          }),
        }));
        return now;
      },

      markSold: (id) =>
        set((s) => ({ properties: s.properties.map((p) => (p.id === id ? { ...p, sold: true } : p)) })),

      runMatch: (r) => {
        const client: ClientReq = { id: uid('c'), ...r };
        set((s) => ({ clients: [client, ...s.clients], lastMatchClientId: client.id }));
        return client;
      },

      rematch: (clientId) => set({ lastMatchClientId: clientId }),

      makeSingleLink: (propId) => {
        const existing = get().links.find((l) => l.kind === 'single' && l.propId === propId);
        if (existing) return null;
        const p = get().properties.find((x) => x.id === propId);
        if (!p) return null;
        const link: ShareLink = {
          id: uid('lk'), kind: 'single', propId, label: p.title,
          slug: 'p/' + propId + Math.random().toString(36).slice(2, 5),
          views: 0, enquiries: 0, created: Date.now(),
        };
        set((s) => ({ links: [link, ...s.links] }));
        get().publishLink(link);
        return link;
      },

      makeCollectionLink: () => {
        const cid = get().lastMatchClientId;
        const req = get().clients.find((c) => c.id === cid);
        if (!req) return null;
        const link: ShareLink = {
          id: uid('lk'), kind: 'collection', clientId: req.id,
          label: `${req.name} · ${req.type} ${req.bhk ? req.bhk + 'BHK' : ''} in ${req.area}`,
          slug: 'c/' + req.name.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).slice(2, 6),
          views: 0, enquiries: 0, created: Date.now(),
        };
        set((s) => ({ links: [link, ...s.links] }));
        get().publishLink(link);
        return link;
      },

      registerView: (linkId) =>
        set((s) => ({ links: s.links.map((l) => (l.id === linkId ? { ...l, views: l.views + 1 } : l)) })),

      simulateNewStock: () => {
        const coll = get().links.find((l) => l.kind === 'collection');
        if (!coll) return null;
        const req = get().clients.find((c) => c.id === coll.clientId);
        if (!req) return null;
        const mid = Math.round((req.min + req.max) / 2);
        const newProp: Property = {
          id: uid('p'), title: '3BHK Villa · Sobha Lifestyle', type: req.type,
          area: req.area, bhk: req.bhk || 3, sqft: 2100, price: mid,
          gradient: randomGradient(), onMarket: false,
        };
        set((s) => ({ properties: [newProp, ...s.properties] }));
        // Republish smart-collection links so buyers' open pages pick up new stock,
        // flagging the freshly added home so the buyer view can badge it.
        get()
          .links.filter((l) => l.kind === 'collection')
          .forEach((l) => get().publishLink(l, { newPropId: newProp.id }));

        // Notify the tied client on WhatsApp that their collection just grew.
        const count = strongMatches(get().properties, req).length;
        const text = linkUpdatedMessage({
          brief: briefFromClient(req), url: shareUrl(coll.slug), newTitle: newProp.title, count,
        });
        const conv = get().conversations.find((c) => digits(c.phone) === digits(req.phone));
        if (conv) {
          set((s) => ({
            conversations: s.conversations.map((c) =>
              c.id === conv.id
                ? { ...c, msgs: [...c.msgs, { me: true, t: text, ts: Date.now(), via: 'whatsapp' as const }] }
                : c,
            ),
          }));
          if (typeof window !== 'undefined') {
            fetch('/api/whatsapp/send', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ to: conv.phone, text }),
            }).catch(() => {});
          }
        }
        return req.name;
      },

      publishLink: (link, opts) => {
        const { properties, clients } = get();
        const dto = (p: Property, score?: number, isNew?: boolean) => ({
          id: p.id, title: p.title, area: p.area, type: p.type,
          bhk: p.bhk, sqft: p.sqft, price: p.price, gradient: p.gradient,
          ...(score != null ? { score } : {}),
          ...(isNew ? { isNew: true } : {}),
        });
        let props: ReturnType<typeof dto>[] = [];
        if (link.kind === 'single') {
          const p = properties.find((x) => x.id === link.propId);
          if (p) props = [dto(p)];
        } else {
          const req = clients.find((c) => c.id === link.clientId);
          if (req) props = strongMatches(properties, req).map((m) => dto(m.p, m.score, m.p.id === opts?.newPropId));
        }
        if (typeof window === 'undefined') return;
        const payload = {
          slug: link.slug, kind: link.kind, label: link.label,
          brokerName: BROKER.agency, brokerScore: BROKER.score, props, created: link.created,
          // `updated` only moves past `created` on an auto-update, so the buyer
          // view can tell a fresh collection from one that just changed.
          updated: opts?.newPropId ? Date.now() : link.created,
        };
        fetch('/api/links', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => {});
      },

      ingestEnquiries: (items, cursor) => {
        if (items.length) {
          const links = get().links;
          for (const it of items) {
            const link = links.find((l) => l.slug === it.slug);
            get().addEnquiry({
              propId: it.propId,
              linkId: link?.id ?? null,
              name: it.name || '',
              phone: it.phone || '',
              msg: it.msg || '',
            });
          }
          get().toast(items.length + (items.length === 1 ? ' new enquiry' : ' new enquiries') + ' from your links');
        }
        set({ enqCursor: cursor });
      },

      requestCobroke: () => {},

      acceptCobroke: (id) => {
        const m = get().cobrokeMarket.find((x) => x.id === id);
        if (!m) return null;
        set((s) => ({
          myCobroke: [{ ...m, status: 'Connected' }, ...s.myCobroke],
          cobrokeMarket: s.cobrokeMarket.filter((x) => x.id !== id),
          conversations: [
            {
              id: uid('w'), name: m.broker + ' (co-broker)',
              phone: '9198120' + Math.floor(1000 + Math.random() * 8999),
              tag: 'CO-BROKE', unread: 1,
              msgs: [{ me: false, t: `Great, ${m.split}:${100 - m.split} on ${m.title}. I'll share availability.` }],
            },
            ...s.conversations,
          ],
        }));
        return m;
      },

      markRead: (convId) =>
        set((s) => ({ conversations: s.conversations.map((c) => (c.id === convId ? { ...c, unread: 0 } : c)) })),

      appendOutgoing: (convId, text) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId ? { ...c, msgs: [...c.msgs, { me: true, t: text, ts: Date.now(), via: 'app' }] } : c,
          ),
        })),

      sendWhatsApp: async (convId, text) => {
        get().appendOutgoing(convId, text);
        const conv = get().conversations.find((c) => c.id === convId);
        if (!conv) return { live: false };
        try {
          const res = await fetch('/api/whatsapp/send', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ to: conv.phone, text }),
          });
          const data = await res.json().catch(() => ({}));
          return { live: !!data.live };
        } catch {
          return { live: false };
        }
      },

      ingestInbound: (items, cursor) => {
        set((s) => {
          if (!items.length) return { waCursor: cursor };
          const conversations = s.conversations.map((c) => ({ ...c, msgs: [...c.msgs] }));
          for (const it of items) {
            let c = conversations.find((x) => digits(x.phone) === digits(it.from));
            const isNewConv = !c;
            if (!c) {
              c = { id: uid('w'), name: it.name || it.from, phone: it.from, tag: '', unread: 0, msgs: [] };
              conversations.unshift(c);
            }
            if (it.waId && c.msgs.some((m) => m.waId === it.waId)) continue;
            c.msgs.push({ me: false, t: it.text, ts: it.ts, via: 'whatsapp', waId: it.waId });
            c.unread += 1;
            // First time we hear from this number: reply with the automated
            // first-contact greeting so the buyer isn't left waiting. (In live
            // mode the webhook route should also dispatch these via the send API.)
            if (isNewConv) {
              const now = Date.now();
              for (const w of firstContactMessages({ name: c.name })) {
                c.msgs.push({ me: true, t: w, ts: now, via: 'whatsapp' });
              }
            }
          }
          return { conversations, waCursor: cursor };
        });
      },

      addEnquiry: ({ propId, linkId, name, phone, msg }) => {
        let score = 55;
        const t = (msg || '').toLowerCase();
        if (/visit|see|saturday|sunday|weekend|today|tomorrow/.test(t)) score += 22;
        if (/buy|book|token|finalis|ready|interested/.test(t)) score += 12;
        if (/price|negoti|emi|loan/.test(t)) score += 6;
        if (phone) score += 5;
        score = Math.min(97, score);
        const lead: Lead = {
          id: uid('l'), name: name || 'Live buyer', phone, msg: msg || 'Interested in this property',
          score, temp: score >= 70 ? 'HOT' : score >= 45 ? 'WARM' : 'COLD', propId,
          linkId: linkId ?? null, created: Date.now(),
        };
        set((s) => ({
          leads: [lead, ...s.leads],
          links: linkId ? s.links.map((l) => (l.id === linkId ? { ...l, enquiries: l.enquiries + 1 } : l)) : s.links,
        }));
        return score;
      },

      setLeadFilter: (f) => set({ leadFilter: f }),

      genInvoice: ({ propId, title, client, value, rate, cobroke, split }) => {
        const c = commission({ valuePaise: value, ratePct: rate, cobroke, splitPct: split });
        const inv: Invoice = {
          id: uid('inv'), no: 'BRK-' + (1000 + get().invoices.length + 1),
          title, client: client || 'Buyer', value, rate, gross: c.gross, cobroke, split,
          share: c.share, gst: c.gst, total: c.total, status: 'Generated',
          date: new Date().toLocaleDateString('en-IN'),
        };
        set((s) => ({ invoices: [inv, ...s.invoices] }));
        return inv;
      },

      advanceInvoice: (id) => {
        const steps: Invoice['status'][] = ['Generated', 'Sent', 'Viewed', 'Paid'];
        set((s) => ({
          invoices: s.invoices.map((v) => {
            if (v.id !== id) return v;
            const i = steps.indexOf(v.status);
            return { ...v, status: steps[Math.min(i + 1, steps.length - 1)] };
          }),
        }));
      },

      reset: () =>
        set({
          properties: seedProperties(), clients: seedClients(), links: [], leads: seedLeads(),
          invoices: [], conversations: seedConversations(), cobrokeMarket: seedCobroke(),
          myCobroke: [], lastMatchClientId: null, leadFilter: 'all', waCursor: 0, enqCursor: 0,
        }),
    }),
    {
      name: 'brokly-store',
      version: 1,
      // Only touch the browser's localStorage on the client (avoids Node's
      // experimental global localStorage during SSR/prerender).
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? window.localStorage
          : { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      ),
      skipHydration: true,
      partialize: (s) => ({
        properties: s.properties, clients: s.clients, links: s.links, leads: s.leads,
        invoices: s.invoices, conversations: s.conversations, cobrokeMarket: s.cobrokeMarket,
        myCobroke: s.myCobroke, lastMatchClientId: s.lastMatchClientId, enqCursor: s.enqCursor,
      }),
    },
  ),
);
