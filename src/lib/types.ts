// Core domain types for Brokly.
// MONEY: every monetary field below is stored as an integer number of *paise*
// (1 rupee = 100 paise). Never assign a float rupee value directly — go through
// the helpers in ./money.ts. This mirrors the CLAUDE.md rule for financial data.

export type PropertyType = 'Apartment' | 'Villa' | 'Plot' | 'Commercial';
export type Urgency = 'Urgent' | 'This month' | 'Browsing';
export type Temp = 'HOT' | 'WARM' | 'COLD';
export type LinkKind = 'single' | 'collection';
export type InvoiceStatus = 'Generated' | 'Sent' | 'Viewed' | 'Paid';
export type ChatTag = '' | 'HOT' | 'CO-BROKE';

export interface Property {
  id: string;
  title: string;
  type: PropertyType;
  area: string;
  bhk: number; // 0 = not applicable (plot/commercial)
  sqft: number;
  price: number; // paise
  rent?: number; // paise (for commercial/rental listings)
  gradient: string; // CSS gradient used as a photo placeholder
  onMarket: boolean; // listed on the co-broke marketplace
  sold?: boolean;
}

export interface ClientReq {
  id: string;
  name: string;
  phone: string;
  type: PropertyType;
  bhk: number; // 0 = any
  area: string;
  min: number; // paise
  max: number; // paise
  urg: Urgency;
}

export interface ShareLink {
  id: string;
  kind: LinkKind;
  slug: string;
  label: string;
  propId?: string; // for single links
  clientId?: string; // for smart-collection links
  views: number;
  enquiries: number;
  created: number;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  msg: string;
  score: number;
  temp: Temp;
  propId?: string;
  linkId?: string | null;
  created: number;
}

export interface Invoice {
  id: string;
  no: string;
  title: string;
  client: string;
  value: number; // paise — sale value
  rate: number; // percent, e.g. 1 or 1.5
  gross: number; // paise
  cobroke: boolean;
  split: number; // percent
  share: number; // paise
  gst: number; // paise
  total: number; // paise
  status: InvoiceStatus;
  date: string;
}

export interface Msg {
  me: boolean;
  t: string;
  ts?: number;
  via?: 'app' | 'whatsapp';
  waId?: string; // WhatsApp message id when sent/received via Cloud API
}

export interface Conversation {
  id: string;
  name: string;
  phone: string;
  tag: ChatTag;
  unread: number;
  msgs: Msg[];
}

export interface CobrokeListing {
  id: string;
  title: string;
  type: PropertyType;
  area: string;
  bhk: number;
  sqft: number;
  price: number; // paise (0 for rent-only)
  rent?: number; // paise
  split: number; // percent
  broker: string;
  score: number;
  gradient: string;
  locked: boolean;
  status?: string;
}
