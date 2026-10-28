'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Main nav. On phones the links fold into a menu behind a toggle button;
 * on wider screens the toggle is hidden and the links sit in a row as before.
 */
export function SiteNav({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    // Capture on window so a link that opens a popup (which stops the click) still closes the menu.
    const onClick = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t?.closest?.('.site-head') || t.closest('#main-nav a')) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('click', onClick, true);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('click', onClick, true); };
  }, [open]);

  return (
    <>
      <button type="button" className="nav-toggle" aria-expanded={open} aria-controls="main-nav" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(o => !o)}>
        <span aria-hidden="true" className="nav-toggle-bars"><i /><i /><i /></span>
      </button>
      <nav
        id="main-nav"
        className={`nav${open ? ' open' : ''}`}
        aria-label="Main"
      >
        {children}
      </nav>
    </>
  );
}
