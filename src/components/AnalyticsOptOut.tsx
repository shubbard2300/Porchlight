'use client';

import { useEffect, useState } from 'react';
import { ANALYTICS_OPT_OUT_KEY } from '@/lib/analytics';

/** The Cookie Policy switch that turns Google Analytics off (or back on) in this browser. */
export function AnalyticsOptOut() {
  const [state, setState] = useState<'on' | 'off' | 'gpc' | null>(null);

  useEffect(() => {
    let off = false;
    try { off = localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === '1'; } catch { /* no storage */ }
    const gpc = (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
    setState(gpc ? 'gpc' : off ? 'off' : 'on');
  }, []);

  if (!state) return null;
  if (state === 'gpc') return <p className="notice">Your browser sends Global Privacy Control, so analytics is already off for you.</p>;

  function toggle() {
    const next = state === 'on' ? 'off' : 'on';
    try {
      if (next === 'off') localStorage.setItem(ANALYTICS_OPT_OUT_KEY, '1');
      else localStorage.removeItem(ANALYTICS_OPT_OUT_KEY);
    } catch { /* private mode: the choice lasts until the tab closes */ }
    // Reload so the page starts (or stops) Google Analytics with the new choice.
    location.reload();
  }

  return (
    <div className="notice" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <span>Analytics is <b>{state === 'on' ? 'on' : 'off'}</b> in this browser.</span>
      <button type="button" className="btn ghost sm" onClick={toggle}>{state === 'on' ? 'Turn analytics off' : 'Turn analytics back on'}</button>
    </div>
  );
}
