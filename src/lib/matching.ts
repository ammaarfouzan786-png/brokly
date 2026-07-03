import type { Property, ClientReq } from './types';

export interface MatchResult {
  score: number;
  reasons: string[];
}

export interface RankedMatch extends MatchResult {
  p: Property;
}

/**
 * Score how well a property fits a client's requirement (0-100).
 * Ported verbatim from the Brokly prototype's matching engine so the ranking
 * behaviour is identical: type (30), config/BHK (25), area (25), budget (22),
 * with partial credit for near-misses.
 */
export function matchScore(p: Property, req: ClientReq): MatchResult {
  let s = 0;
  const r: string[] = [];

  if (p.type === req.type) {
    s += 30;
    r.push('Type fits');
  } else if (
    (p.type === 'Villa' && req.type === 'Apartment') ||
    (p.type === 'Apartment' && req.type === 'Villa')
  ) {
    s += 8;
  }

  if (req.bhk === 0) {
    s += 18;
  } else if (p.bhk === req.bhk) {
    s += 25;
    r.push(req.bhk + 'BHK match');
  } else if (Math.abs(p.bhk - req.bhk) === 1) {
    s += 12;
    r.push('Close on config');
  }

  if (p.area === req.area) {
    s += 25;
    r.push('In ' + p.area);
  } else {
    s += 6;
  }

  if (p.price >= req.min && p.price <= req.max) {
    s += 22;
    r.push('In budget');
  } else {
    const mid = (req.min + req.max) / 2;
    const off = Math.abs(p.price - mid) / (mid || 1);
    if (off <= 0.12) {
      s += 12;
      r.push('Just off budget');
    } else if (off <= 0.25) {
      s += 5;
    }
  }

  return { score: Math.min(100, s), reasons: r };
}

/** Rank a list of properties against a requirement, best first. */
export function rankProperties(props: Property[], req: ClientReq): RankedMatch[] {
  return props
    .map((p) => ({ p, ...matchScore(p, req) }))
    .sort((a, b) => b.score - a.score);
}

/** Properties that are a strong-enough fit to show in a smart collection. */
export const STRONG_FIT = 55;
export const strongMatches = (props: Property[], req: ClientReq): RankedMatch[] =>
  rankProperties(props, req).filter((m) => m.score >= STRONG_FIT);
