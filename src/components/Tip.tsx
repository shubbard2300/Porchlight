'use client';

import { useEffect, useState } from 'react';

/**
 * First-visit tips: small callouts pointing at a feature, shown for someone's first two visits
 * (browser sessions) after they join, until they press "I got it". Remembered in this browser only.
 */
const KEY = 'pl-tips';
const VISIT_KEY = 'pl-tips-visit';
const TIP_VISITS = 2;

type Store = { visits: number; seen: string[]; off?: boolean };

function read(): Store {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? '') as Store;
    return { visits: Number(s.visits) || 0, seen: Array.isArray(s.seen) ? s.seen : [], off: Boolean(s.off) };
  } catch {
    return { visits: 0, seen: [] };
  }
}

function write(s: Store) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode: tips just come back */ }
}

/** Counts this browser session as one visit, the first time any tip asks. */
function thisVisit(): Store {
  const s = read();
  try {
    if (!sessionStorage.getItem(VISIT_KEY)) {
      sessionStorage.setItem(VISIT_KEY, '1');
      s.visits += 1;
      write(s);
    }
  } catch { /* no storage: treat as a first visit */ }
  return s;
}

/**
 * `arrow` points at what the tip is about: below it (down), above it (up), or `float` to sit over it, like the map.
 * `news` announces a new feature: it shows past the first two visits too, until dismissed.
 */
export function Tip({ id, children, arrow = 'down', news = false }: { id: string; children: React.ReactNode; arrow?: 'down' | 'up' | 'float'; news?: boolean }) {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const s = thisVisit();
    setShow(!s.off && (news || s.visits <= TIP_VISITS) && !s.seen.includes(id));
    // Another tip's "Hide all tips" hides this one too.
    const onOff = () => setShow(false);
    window.addEventListener('pl-tips-off', onOff);
    return () => window.removeEventListener('pl-tips-off', onOff);
  }, [id, news]);

  if (!show) return null;

  const dismiss = (all: boolean) => {
    const s = read();
    write({ ...s, seen: [...new Set([...s.seen, id])], off: s.off || all });
    setLeaving(true);
    setTimeout(() => {
      setShow(false);
      if (all) window.dispatchEvent(new Event('pl-tips-off'));
    }, 180);
  };

  return (
    <div className={`tip tip-${arrow}${leaving ? ' leaving' : ''}`} role="note">
      <span className="tip-dot" aria-hidden="true" />
      <p>{children}</p>
      <div className="tip-actions">
        <button type="button" className="tip-ok" onClick={() => dismiss(false)}>I got it</button>
        <button type="button" className="tip-off" onClick={() => dismiss(true)}>Hide all tips</button>
      </div>
    </div>
  );
}
