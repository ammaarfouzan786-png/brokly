import { bpsOf, pctToBps } from './money';

export interface CommissionInput {
  valuePaise: number;
  ratePct: number; // e.g. 1 or 1.5
  cobroke: boolean;
  splitPct: number; // your share when co-broked
}

export interface CommissionResult {
  gross: number; // paise
  share: number; // paise
  gst: number; // paise (18%)
  total: number; // paise (share + gst) — what you invoice
}

/** Brokerage commission with optional co-broke split and 18% GST. */
export function commission({
  valuePaise,
  ratePct,
  cobroke,
  splitPct,
}: CommissionInput): CommissionResult {
  const gross = bpsOf(valuePaise, pctToBps(ratePct));
  const share = cobroke ? bpsOf(gross, pctToBps(splitPct)) : gross;
  const gst = bpsOf(share, 1800); // 18% GST on the brokerage service
  return { gross, share, gst, total: share + gst };
}
