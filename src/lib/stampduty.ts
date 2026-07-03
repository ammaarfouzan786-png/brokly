import { bpsOf, rupees } from './money';

// Karnataka stamp duty + registration. All inputs/outputs in paise.

export interface StampSale {
  kind: 'sale';
  stamp: number;
  cess: number;
  reg: number;
  total: number;
}

export interface StampRent {
  kind: 'rent';
  stamp: number;
  reg: number;
  total: number;
  note: string;
}

export type StampResult = StampSale | StampRent;

/** Sale / purchase: stamp 5%, cess 0.5%, registration 1%. */
export function stampSale(valuePaise: number): StampSale {
  const stamp = bpsOf(valuePaise, 500); // 5%
  const cess = bpsOf(valuePaise, 50); // 0.5%
  const reg = bpsOf(valuePaise, 100); // 1%
  return { kind: 'sale', stamp, cess, reg, total: stamp + cess + reg };
}

/** 11-month rental agreement: stamp 0.5% of annual rent (min ₹500), reg ₹200. */
export function stampRent(monthlyPaise: number): StampRent {
  const annual = monthlyPaise * 11;
  const stamp = Math.max(bpsOf(annual, 50), rupees(500));
  const reg = rupees(200);
  return {
    kind: 'rent',
    stamp,
    reg,
    total: stamp + reg,
    note: '11-month Karnataka rental agreement',
  };
}
