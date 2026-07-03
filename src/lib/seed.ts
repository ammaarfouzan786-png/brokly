import type {
  Property,
  ClientReq,
  Lead,
  Conversation,
  CobrokeListing,
} from './types';
import { rupees } from './money';
import { gradientAt } from './util';

// Stable seed data (fixed ids, no randomness) so server and client render the
// same initial state — random ids are only minted at runtime for user actions.

export const seedProperties = (): Property[] => [
  { id: 'p1', title: '3BHK · Prestige Lakeside', type: 'Apartment', area: 'Whitefield', bhk: 3, sqft: 1575, price: rupees(14500000), gradient: gradientAt(0), onMarket: false },
  { id: 'p2', title: '4BHK Penthouse · Sobha Dream', type: 'Apartment', area: 'Sarjapur', bhk: 4, sqft: 1840, price: rupees(21000000), gradient: gradientAt(1), onMarket: false },
  { id: 'p3', title: '2BHK · Purva Skydale', type: 'Apartment', area: 'HSR Layout', bhk: 2, sqft: 1280, price: rupees(7800000), gradient: gradientAt(2), onMarket: false },
  { id: 'p4', title: '3BHK · Brigade Northridge', type: 'Apartment', area: 'Hebbal', bhk: 3, sqft: 1450, price: rupees(11800000), gradient: gradientAt(3), onMarket: false },
  { id: 'p5', title: '3BHK Villa · Adarsh Palm', type: 'Villa', area: 'Sarjapur', bhk: 3, sqft: 2200, price: rupees(17800000), gradient: gradientAt(4), onMarket: true },
];

export const seedClients = (): ClientReq[] => [
  { id: 'c1', name: 'Rajesh Iyer', phone: '919900112233', type: 'Villa', bhk: 3, area: 'Sarjapur', min: rupees(16000000), max: rupees(19000000), urg: 'Urgent' },
];

export const seedLeads = (): Lead[] => [
  { id: 'l-seed1', name: 'Priya Menon', phone: '919845567890', msg: 'Can I visit the Whitefield 3BHK this Saturday?', score: 88, temp: 'HOT', propId: 'p1', linkId: null, created: 0 },
];

export const seedConversations = (): Conversation[] => [
  {
    id: 'w1', name: 'Priya Menon', phone: '919845567890', tag: 'HOT', unread: 1,
    msgs: [
      { me: false, t: 'Hi, saw the Whitefield 3BHK link 👍' },
      { me: false, t: 'Can I visit this Saturday? And is parking included?' },
    ],
  },
  {
    id: 'w2', name: 'Rajesh Iyer', phone: '919900112233', tag: '', unread: 0,
    msgs: [
      { me: false, t: 'Looking for a villa in Sarjapur, budget around 1.8Cr' },
      { me: true, t: 'I have a couple of options, sending a link now.' },
    ],
  },
  {
    id: 'w3', name: 'Sneha R. (co-broker)', phone: '919812000111', tag: 'CO-BROKE', unread: 2,
    msgs: [
      { me: false, t: 'Your client liked my Brigade Cornerstone listing?' },
      { me: false, t: 'Happy to do 50:50 on it.' },
    ],
  },
];

export const seedCobroke = (): CobrokeListing[] => [
  { id: 'm1', title: '3BHK · Brigade Cornerstone', type: 'Apartment', area: 'Whitefield', bhk: 3, sqft: 1620, price: rupees(13500000), split: 50, broker: 'Sneha R.', score: 88, gradient: gradientAt(0), locked: true },
  { id: 'm2', title: '4BHK Villa · Prestige Glenwood', type: 'Villa', area: 'Sarjapur', bhk: 4, sqft: 3200, price: rupees(32000000), split: 50, broker: 'Deepa M.', score: 94, gradient: gradientAt(1), locked: true },
  { id: 'm3', title: '2BHK · Sobha HRC Pristine', type: 'Apartment', area: 'Hebbal', bhk: 2, sqft: 1180, price: rupees(9200000), split: 45, broker: 'Karthik V.', score: 76, gradient: gradientAt(2), locked: true },
  { id: 'm4', title: 'Office 4,500 sqft · UB City', type: 'Commercial', area: 'Indiranagar', bhk: 0, sqft: 4500, price: 0, rent: rupees(450000), split: 40, broker: 'Imran K.', score: 81, gradient: gradientAt(3), locked: true },
];

export const BROKER = {
  name: 'Ammar Khan',
  initials: 'AK',
  agency: 'Ammar Estates',
  city: 'Bengaluru',
  area: 'Indiranagar',
  score: 92,
  gstin: '29ABCDE1234F1Z5',
};
