// Demo data for the Money / Commissions dashboard (ported from Brokly_5.html).
// Amounts are plain rupees here (display-only demo); the live commission
// calculator uses integer paise via src/lib/money.ts + commission.ts.

export type CommStatus = 'partial' | 'overdue' | 'received' | 'pending';

export interface Split {
  coBroker: string;
  total: number;
  yours: number;
  theirs: number;
  pct: string; // "60/40"
  theirStatus: 'paid' | 'pending';
}

export interface Comm {
  id: string;
  deal: string;
  client: string;
  clientType: string;
  prop: string;
  salePrice: string;
  commPct: string;
  exp: number; // commission expected (rupees)
  got: number; // received (rupees)
  gst: number; // rupees
  status: CommStatus;
  invoiceStatus: 'paid' | 'paid_partial' | 'overdue' | 'sent';
  invoiceDate: string;
  dueDate: string;
  payLink: string;
  regDate: string;
  split: Split | null;
  timeline: { d: string; e: string }[];
}

export const COMMS: Comm[] = [
  { id: 'c1', deal: 'Brigade Cornerstone 3BHK', client: 'Arjun Mehta', clientType: 'Buyer', prop: 'Brigade Cornerstone', salePrice: '₹1.15 Cr', commPct: '2%', exp: 240000, got: 144000, gst: Math.round(240000 * 0.18), status: 'partial', invoiceStatus: 'paid_partial', invoiceDate: 'Jun 12', dueDate: 'Jun 30', payLink: 'pay.brokly.app/inv/BC2406', regDate: 'Jun 10, 2026', split: null, timeline: [{ d: 'Jun 10', e: 'Deal registered at Sub-Registrar' }, { d: 'Jun 12', e: 'Invoice #BK-2406-001 generated + sent' }, { d: 'Jun 12', e: 'Client viewed invoice' }, { d: 'Jun 14', e: 'Partial payment ₹1,44,000 received via UPI' }, { d: 'Jun 30', e: 'Balance ₹96,000 due' }] },
  { id: 'c2', deal: 'Green Valley HSR 2BHK', client: 'Vikram Nair', clientType: 'Seller', prop: 'Green Valley HSR', salePrice: '₹62 L', commPct: '2%', exp: 180000, got: 0, gst: Math.round(180000 * 0.18), status: 'overdue', invoiceStatus: 'overdue', invoiceDate: 'May 25', dueDate: 'Jun 1 (18 days late)', payLink: 'pay.brokly.app/inv/GV2405', regDate: 'May 22, 2026', split: null, timeline: [{ d: 'May 22', e: 'Deal registered' }, { d: 'May 25', e: 'Invoice #BK-2405-003 sent' }, { d: 'May 26', e: 'Client viewed invoice' }, { d: 'Jun 1', e: 'Due date passed — auto reminder #1 sent' }, { d: 'Jun 8', e: 'Auto reminder #2 sent' }, { d: 'Jun 15', e: '⚠️ Legal notice auto-generated, pending your approval' }] },
  { id: 'c3', deal: 'Sobha Koramangala 2BHK', client: 'Meera Joshi', clientType: 'Buyer', prop: 'Sobha Koramangala', salePrice: '₹76 L', commPct: '2%', exp: 72000, got: 72000, gst: Math.round(72000 * 0.18), status: 'received', invoiceStatus: 'paid', invoiceDate: 'Jun 2', dueDate: 'Paid Jun 8', payLink: 'pay.brokly.app/inv/SK2406', regDate: 'Jun 1, 2026', split: { coBroker: 'Rahul Sharma', total: 120000, yours: 72000, theirs: 48000, pct: '60/40', theirStatus: 'paid' }, timeline: [{ d: 'Jun 1', e: 'Deal registered' }, { d: 'Jun 2', e: 'Invoice #BK-2406-002 sent (split: you 60%, Rahul 40%)' }, { d: 'Jun 5', e: 'Client paid full ₹1,20,000 via Razorpay' }, { d: 'Jun 5', e: 'Auto-split: ₹72,000 to you, ₹48,000 to Rahul' }, { d: 'Jun 8', e: 'Both payments confirmed ✓' }] },
  { id: 'c4', deal: 'Salarpuria Indiranagar 2BHK', client: 'Rohan Seth', clientType: 'Buyer', prop: 'Salarpuria Indiranagar', salePrice: '₹95 L', commPct: '2%', exp: 96000, got: 0, gst: Math.round(96000 * 0.18), status: 'pending', invoiceStatus: 'sent', invoiceDate: 'Jun 18', dueDate: 'Jul 15', payLink: 'pay.brokly.app/inv/SI2406', regDate: 'Jun 15, 2026', split: null, timeline: [{ d: 'Jun 15', e: 'Deal registered' }, { d: 'Jun 18', e: 'Invoice #BK-2406-004 generated + sent' }, { d: 'Jun 19', e: 'Client viewed invoice' }, { d: 'Jul 15', e: 'Payment due' }] },
];

export const FIN = {
  thisMonth: { earned: 216000, pending: 336000, overdue: 180000, gstCollected: 38880, invoicesSent: 4, invoicesPaid: 2 },
  lastMonth: { earned: 180000, pending: 96000, overdue: 0, gstCollected: 32400, invoicesSent: 3, invoicesPaid: 3 },
  quarterly: { q1: { earned: 540000, gst: 97200 }, q2: { earned: 588000, gst: 105840 } },
  yearTotal: { earned: 1128000, gst: 203040, deals: 11 },
};

export const K = (n: number) => '₹' + Math.round(n / 1000) + 'K';
export const L = (n: number) => '₹' + (n / 100000).toFixed(1) + 'L';
