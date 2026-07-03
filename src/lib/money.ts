// Integer-only money helpers. All amounts are paise (1 rupee = 100 paise).
// Percentages are applied via basis points to keep everything on integers,
// with a single explicit round per operation. No float money ever leaves here.

export const RUPEE = 100; // paise per rupee

/** Whole (or fractional) rupees -> integer paise. */
export const rupees = (r: number): number => Math.round((Number(r) || 0) * RUPEE);

/** percent (e.g. 1.5) -> basis points (150). */
export const pctToBps = (pct: number): number => Math.round((Number(pct) || 0) * 100);

/** A basis-point share of a paise amount, rounded to whole paise. */
export const bpsOf = (paise: number, bps: number): number =>
  Math.round(((Number(paise) || 0) * bps) / 10000);

/** Parse a user-typed rupee string ("14500000", "₹1,45,00,000") -> paise. */
export const parseRupees = (s: string | number): number => {
  if (typeof s === 'number') return rupees(s);
  const n = parseFloat(String(s).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? rupees(n) : 0;
};

/** Full INR format, e.g. "₹1,45,00,000". Input is paise. */
export function formatInr(paise: number): string {
  const r = Math.round((Number(paise) || 0) / RUPEE);
  return '₹' + r.toLocaleString('en-IN');
}

/** Compact INR: "₹1.45 Cr" / "₹78 L" / "₹55,000". Input is paise. */
export function formatInrShort(paise: number): string {
  const r = Math.round((Number(paise) || 0) / RUPEE);
  if (r >= 10000000) return '₹' + (r / 10000000).toFixed(2).replace(/\.00$/, '') + ' Cr';
  if (r >= 100000) return '₹' + (r / 100000).toFixed(2).replace(/\.00$/, '') + ' L';
  return formatInr(paise);
}

/** Per-sqft price (paise) for display. */
export const perSqft = (pricePaise: number, sqft: number): number =>
  sqft > 0 ? Math.round(pricePaise / sqft) : 0;
