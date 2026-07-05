'use client';

import { BROKER_STORAGE_KEY as KEY } from './broker';

// The onboarded broker's profile (KYC output), persisted locally.
// In production the Aadhaar/face/RERA checks would go through a real KYC
// provider; here they're simulated and the result is the verified card.

export interface BrokerProfile {
  name: string;
  agency: string;
  email: string;
  phone: string; // digits, with country code
  rera: string;
  aadhaarLast4: string;
  photo?: string; // data URL
  verified: boolean; // the blue tick
  brokerScore: number;
  createdAt: number;
}

export function loadBroker(): BrokerProfile | null {
  try {
    const s = localStorage.getItem(KEY);
    return s ? (JSON.parse(s) as BrokerProfile) : null;
  } catch {
    return null;
  }
}

export function saveBroker(p: BrokerProfile): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function clearBroker(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
