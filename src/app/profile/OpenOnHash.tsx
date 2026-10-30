'use client';

import { useEffect } from 'react';

/**
 * Profile sections live in collapsed accordions, so a link like /profile#alerts would land on a closed one.
 * This opens the <details> the hash points at (or sits inside) and scrolls to it.
 */
export function OpenOnHash() {
  useEffect(() => {
    const open = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      const el = id && document.getElementById(id);
      if (!el) return;
      for (let d = el.closest('details'); d; d = d.parentElement?.closest('details') ?? null) d.open = true;
      el.scrollIntoView({ block: 'start' });
    };
    open();
    addEventListener('hashchange', open);
    return () => removeEventListener('hashchange', open);
  }, []);
  return null;
}
