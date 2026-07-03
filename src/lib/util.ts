// Small shared utilities.

export const GRADIENTS = [
  'linear-gradient(120deg,#3a5a45,#6e8f78)',
  'linear-gradient(120deg,#4a4f6a,#8a90b5)',
  'linear-gradient(120deg,#5a4a3a,#a8906e)',
  'linear-gradient(120deg,#3a5a5a,#6e9b9b)',
  'linear-gradient(120deg,#5a4a4a,#9b7e7e)',
  'linear-gradient(120deg,#3a4a5a,#6e7e9b)',
];

export const gradientAt = (i: number): string =>
  GRADIENTS[((i % GRADIENTS.length) + GRADIENTS.length) % GRADIENTS.length];

/** Random gradient — client-only (avoid during SSR to prevent hydration drift). */
export const randomGradient = (): string =>
  GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];

export const uid = (prefix = ''): string => prefix + Math.random().toString(36).slice(2, 8);

export const cx = (...xs: Array<string | false | null | undefined>): string =>
  xs.filter(Boolean).join(' ');

/** Normalize a phone number to digits only (for wa.me links + Cloud API). */
export const digits = (s: string): string => (s || '').replace(/\D/g, '');

/** Best-effort clipboard copy (client only). */
export function copyText(text: string): void {
  try {
    navigator?.clipboard?.writeText(text);
  } catch {
    /* ignore */
  }
}

/** Public share URL for a link slug. */
export const shareUrl = (slug: string): string =>
  (typeof window !== 'undefined' ? window.location.origin : 'https://brokly.app') + '/l/' + slug;
