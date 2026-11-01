'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { findNearbyHouse, type NearbyHouse as House } from '@/app/actions/nearby';
import { checkInByLocation } from '@/app/actions/visits';
import { distanceM } from '@/lib/visits';
import { NEARBY_MOVE_M, NEARBY_POLL_MS, snoozed, usableFix } from '@/lib/nearby';
import { Icon3D } from './Icon3D';
import styles from './NearbyHouse.module.css';

/** 'on' / 'off' per device, set from the profile switch. Unset means "on if location is already allowed". */
export const NEARBY_PREF_KEY = 'pl-nearby';
const SNOOZE_KEY = 'pl-nearby-snooze';
/** Fired by the profile switch so the watcher starts or stops without a reload. */
export const NEARBY_PREF_EVENT = 'pl-nearby-pref';

type Fix = { lat: number; lng: number; accuracy: number; at: number };

const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const snoozeMap = (): Record<string, number> => { try { return JSON.parse(read(SNOOZE_KEY) ?? '{}'); } catch { return {}; } };
function snooze(id: string) {
  const now = Date.now();
  const m = Object.fromEntries(Object.entries(snoozeMap()).filter(([, t]) => snoozed(t, now)));
  m[id] = now;
  try { localStorage.setItem(SNOOZE_KEY, JSON.stringify(m)); } catch {}
}

/** Pages where the camera is already open, or where a pop-up would get in the way. */
const quietPath = (p: string) => /^\/house\/[^/]+\/(ar|hunt)/.test(p) || p.startsWith('/admin') || p.startsWith('/visit');

async function locationAllowed(): Promise<boolean> {
  try {
    const s = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return s.state === 'granted';
  } catch {
    return false;
  }
}

/**
 * Watches a signed-in visitor's location while Porchlight is open and, when they're standing in
 * front of a contest house, offers to check them in and open the house (straight into the AR camera
 * when the host added decorations). Never asks for location on its own: it runs only when the
 * browser already allows it, or the visitor turned it on in their profile.
 */
export function NearbyHouse() {
  const router = useRouter();
  const path = usePathname();
  const [on, setOn] = useState(false);
  const [house, setHouse] = useState<House | null>(null);
  const [going, setGoing] = useState(false);
  const fix = useRef<Fix | null>(null);
  const asked = useRef<Fix | null>(null);
  const busy = useRef(false);
  const shown = useRef<string | null>(null);
  const quiet = quietPath(path);

  // Decide whether to watch: the per-device switch, else whether location is already allowed.
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    let status: PermissionStatus | null = null;
    const decide = async () => {
      const pref = read(NEARBY_PREF_KEY);
      if (pref === 'off') return setOn(false);
      setOn(pref === 'on' || (await locationAllowed()));
    };
    decide();
    navigator.permissions?.query({ name: 'geolocation' as PermissionName }).then((s) => { status = s; s.onchange = decide; }).catch(() => {});
    addEventListener(NEARBY_PREF_EVENT, decide);
    return () => { removeEventListener(NEARBY_PREF_EVENT, decide); if (status) status.onchange = null; };
  }, []);

  const ask = useCallback(async (f: Fix) => {
    if (busy.current || document.hidden) return;
    const last = asked.current;
    if (last) {
      const since = f.at - last.at;
      const moved = distanceM(last, f);
      if (since < NEARBY_POLL_MS || (moved < NEARBY_MOVE_M && since < NEARBY_POLL_MS * 3)) return;
    }
    busy.current = true;
    asked.current = f;
    try {
      const h = await findNearbyHouse(f.lat, f.lng, f.accuracy);
      if (h && !snoozed(snoozeMap()[h.id], Date.now()) && shown.current !== h.id) {
        shown.current = h.id;
        setHouse(h);
        navigator.vibrate?.([40, 60, 40]);
      }
    } catch {
      // Offline or the server hiccuped: try again on the next reading.
    } finally {
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    if (!on || quiet) return;
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const f = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy, at: Date.now() };
        fix.current = f;
        if (usableFix(f.accuracy)) ask(f);
      },
      (err) => { if (err.code === err.PERMISSION_DENIED) setOn(false); },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 30_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [on, quiet, ask]);

  // Opening the camera page or the house itself counts as having seen the prompt.
  useEffect(() => { if (quiet || (house && path === `/house/${house.id}`)) setHouse(null); }, [quiet, path, house]);

  const dismiss = useCallback(() => {
    if (house) snooze(house.id);
    setHouse(null);
  }, [house]);

  useEffect(() => {
    if (!house) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss(); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [house, dismiss]);

  const view = async () => {
    if (!house) return;
    setGoing(true);
    snooze(house.id);
    const f = fix.current;
    const r = f ? await checkInByLocation(house.id, f.lat, f.lng, f.accuracy).catch(() => null) : null;
    const tag = r?.ok ? '?checkin=nearby' : '';
    router.push(house.hasAr ? `/house/${house.id}/ar${tag}` : `/house/${house.id}${tag}#vote`);
    setHouse(null);
    setGoing(false);
  };

  if (!house || quiet) return null;
  return (
    <div className={styles.card} role="dialog" aria-modal="false" aria-labelledby="nearby-title" aria-describedby="nearby-body">
      <button type="button" className={styles.x} aria-label="Dismiss" onClick={dismiss}>✕</button>
      <div className={styles.top}>
        {house.photo
          ? <img src={house.photo} alt="" className={styles.photo} />
          : <span className={styles.photo} aria-hidden="true"><Icon3D name="house" size={40} /></span>}
        <div className={styles.text}>
          <span className={styles.eyebrow}><span className={styles.dot} aria-hidden="true" />You&rsquo;re here</span>
          <h2 id="nearby-title" className={styles.title}>{house.name}</h2>
          <p id="nearby-body" className={styles.body}>
            {house.hasAr
              ? 'Check in with one tap, then point your camera at the house to see the host’s magic decorations.'
              : 'Check in with one tap, then score the display and cheer on the host.'}
          </p>
        </div>
      </div>
      <div className={styles.actions}>
        <button type="button" className="btn ghost" onClick={dismiss} disabled={going}>Dismiss</button>
        <button type="button" className="btn primary" onClick={view} disabled={going} autoFocus>
          <Icon3D name={house.hasAr ? 'camera' : 'house'} size={22} />{going ? 'Checking in…' : 'View house'}
        </button>
      </div>
    </div>
  );
}
