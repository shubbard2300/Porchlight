'use client';

import { useEffect } from 'react';

/** Registers /sw.js so the site can be installed and receive push alerts. */
export function ServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);
  return null;
}
