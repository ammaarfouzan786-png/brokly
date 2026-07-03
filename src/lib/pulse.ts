// Brokly Pulse — the broker's market-intelligence feed.
// Seed items ported from the prototype; can be refreshed with AI via /api/pulse.

export type PulseTab = 'All' | 'Market' | 'Area signals' | 'Network';

export interface PulseItem {
  color: string;
  label: string;
  title: string;
  body: string;
  act: string;
  tab: Exclude<PulseTab, 'All'>;
}

export const PULSE_TABS: PulseTab[] = ['All', 'Market', 'Area signals', 'Network'];

export const SEED_PULSE: PulseItem[] = [
  {
    color: '#E0473C', label: '🔴 AREA SIGNAL', tab: 'Area signals',
    title: 'Whitefield 3BHK demand up 38% this month',
    body: 'Your Whitefield listings are perfectly timed. Network average close time: 12 days.',
    act: 'See your Whitefield stock',
  },
  {
    color: '#0B6B3A', label: '📰 ET REALTY', tab: 'Market',
    title: 'Bengaluru residential records 18% YoY growth in Q2',
    body: 'Whitefield, Sarjapur and Indiranagar lead demand. Gated societies command a 22% premium.',
    act: 'Read more',
  },
  {
    color: '#0B6B3A', label: '🟢 BROKLY NETWORK', tab: 'Network',
    title: '14 co-broking deals closed in Koramangala this week',
    body: '3 brokers near you have active Koramangala stock. You have a buyer requirement — check your AI matches.',
    act: 'Open AI matches',
  },
  {
    color: '#C98A15', label: '⚖️ REGULATORY', tab: 'Market',
    title: 'Karnataka stamp duty for women buyers held at 3%',
    body: 'A female buyer on a ₹76L flat saves ₹1.52L vs the standard 5%. Use this in your sales pitch.',
    act: 'Open calculator',
  },
  {
    color: '#C98A15', label: '🏗️ BUILDER ALERT', tab: 'Area signals',
    title: 'Brigade Phase 3 launches in Sarjapur — 3BHK from ₹1.1 Cr',
    body: 'Pre-launch pricing for 30 days. Channel-partner commission at 2.5%.',
    act: 'Register interest',
  },
];

export const PULSE_SYSTEM = `You are Brokly's market-intelligence engine for Indian real-estate brokers.
Produce a concise "market pulse" feed of 5 items for the given city/areas. Each item has:
- label: a short ALL-CAPS source tag with a leading emoji (e.g. "📰 ET REALTY", "🔴 AREA SIGNAL", "🟢 BROKLY NETWORK", "⚖️ REGULATORY", "🏗️ BUILDER ALERT")
- title: a punchy 1-line headline
- body: 1-2 sentences with a specific, broker-useful takeaway (use ₹ lakh/crore)
- act: a short call-to-action label
- tab: one of "Market" | "Area signals" | "Network"
Return ONLY JSON: { "items": [ {label,title,body,act,tab}, ... ] }. Keep figures plausible and clearly indicative.`;
