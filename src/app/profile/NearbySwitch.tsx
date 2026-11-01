'use client';

import { useEffect, useState } from 'react';
import { NEARBY_PREF_EVENT, NEARBY_PREF_KEY } from '@/components/NearbyHouse';

type State = 'checking' | 'on' | 'off' | 'unsupported';

/** Per-device switch for the "You're here" prompt that pops up in front of a contest house. */
export function NearbySwitch() {
  const [state, setState] = useState<State>('checking');
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) return setState('unsupported');
    let pref: string | null = null;
    try { pref = localStorage.getItem(NEARBY_PREF_KEY); } catch {}
    if (pref) return setState(pref === 'on' ? 'on' : 'off');
    navigator.permissions?.query({ name: 'geolocation' as PermissionName })
      .then((s) => setState(s.state === 'granted' ? 'on' : 'off'))
      .catch(() => setState('off'));
  }, []);

  const set = (v: 'on' | 'off') => {
    try { localStorage.setItem(NEARBY_PREF_KEY, v); } catch {}
    setState(v);
    dispatchEvent(new Event(NEARBY_PREF_EVENT));
  };

  const turnOn = () => {
    setNote(null);
    // Asking once here is what brings up the browser's location prompt.
    navigator.geolocation.getCurrentPosition(
      () => { set('on'); setNote('On. Keep Porchlight open as you walk and we’ll tap you when you reach a house.'); },
      (e) => setNote(e.code === e.PERMISSION_DENIED
        ? 'Location is blocked for this site. Allow it in your browser settings, then try again.'
        : 'We couldn’t get your location just now. Try again outside.'),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  if (state === 'unsupported') return null;
  return (
    <div className="stack" style={{ gap: 8, borderTop: '2px dashed var(--sand)', paddingTop: 14 }}>
      <div className="row spread" style={{ gap: 10 }}>
        <span className="small">
          <b>&ldquo;You&rsquo;re here&rdquo; prompts</b>
          <span className="muted"> · While Porchlight is open, we tap you when you reach a house, so you can check in and see any magic decorations in one go. Your location is never saved.</span>
        </span>
        {state === 'on'
          ? <button type="button" className="btn ghost sm" onClick={() => { set('off'); setNote(null); }}>Turn off here</button>
          : <button type="button" className="btn primary sm" onClick={turnOn} disabled={state === 'checking'}>Turn on</button>}
      </div>
      {note && <p className="small" role="status">{note}</p>}
    </div>
  );
}
