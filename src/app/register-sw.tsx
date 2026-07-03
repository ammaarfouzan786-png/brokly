'use client';

import { useEffect } from 'react';

/** Registers the PWA service worker (production only, to avoid dev caching). */
export function RegisterSW() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);
  return null;
}
