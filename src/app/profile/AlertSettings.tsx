'use client';

import { useEffect, useState, useTransition } from 'react';
import { ALERT_KINDS, ALERT_RADII } from '@/lib/alerts';
import { removePushSubscription, saveAlertPrefs, savePushSubscription, sendTestAlert } from '../actions/push';

type Prefs = Record<(typeof ALERT_KINDS)[number]['key'], boolean>;
type InstallEvent = Event & { prompt: () => Promise<void> };
type Support = 'checking' | 'ok' | 'ios-install' | 'unsupported';

function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

/** Push alert switches for this device, plus which alerts to get and where "near me" is. */
export function AlertSettings({ vapidKey, initial, hasSpot, radiusKm, devices }: { vapidKey: string | null; initial: Prefs; hasSpot: boolean; radiusKm: number; devices: number }) {
  const [support, setSupport] = useState<Support>('checking');
  const [sub, setSub] = useState<PushSubscription | null>(null);
  const [prefs, setPrefs] = useState(initial);
  const [radius, setRadius] = useState(radiusKm);
  const [spot, setSpot] = useState(hasSpot);
  const [note, setNote] = useState<string | null>(null);
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    const standalone = matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setSupport(ios && !standalone ? 'ios-install' : 'unsupported');
      return;
    }
    setSupport('ok');
    navigator.serviceWorker.ready.then((reg) => reg.pushManager.getSubscription()).then(setSub).catch(() => {});
    const onPrompt = (e: Event) => { e.preventDefault(); setInstall(e as InstallEvent); };
    addEventListener('beforeinstallprompt', onPrompt);
    return () => removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const turnOn = () => start(async () => {
    setNote(null);
    if (!vapidKey) return;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') { setNote('Alerts are blocked for this site. Allow notifications in your browser settings, then try again.'); return; }
    const reg = await navigator.serviceWorker.ready;
    const s = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidKey) }));
    const json = s.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
    const { ok } = await savePushSubscription(json, navigator.userAgent);
    if (ok) { setSub(s); setNote('Alerts are on for this device.'); } else setNote('That didn’t work. Please try again.');
  });

  const turnOff = () => start(async () => {
    if (!sub) return;
    await removePushSubscription(sub.endpoint);
    await sub.unsubscribe().catch(() => {});
    setSub(null);
    setNote('Alerts are off for this device.');
  });

  const save = (next: Prefs, place: { lat: number; lng: number } | null | 'clear', km: number) => start(() => saveAlertPrefs(next, place, km));
  const toggle = (key: keyof Prefs) => { const next = { ...prefs, [key]: !prefs[key] }; setPrefs(next); save(next, null, radius); };
  const useLocation = () => {
    setNote(null);
    navigator.geolocation.getCurrentPosition(
      (p) => { setSpot(true); save(prefs, { lat: p.coords.latitude, lng: p.coords.longitude }, radius); setNote('Saved. You’ll hear about new houses near here.'); },
      () => setNote('We couldn’t get your location. Allow location for this site and try again.'),
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };
  const test = () => start(async () => { const n = await sendTestAlert(); setNote(n ? 'Test alert sent. It should pop up in a moment.' : 'No device got it. Turn alerts on above first.'); });

  return (
    <div className="stack" style={{ gap: 14 }}>
      {!vapidKey ? <p className="small muted">Push alerts are coming soon.</p>
        : support === 'ios-install' ? (
          <p className="notice small">On iPhone, alerts work in the Porchlight app: tap <b>Share</b>, then <b>Add to Home Screen</b>, then open Porchlight from your home screen and come back here.</p>
        ) : support === 'unsupported' ? <p className="small muted">This browser can&apos;t show alerts. Try Chrome, Edge, Firefox or Safari.</p>
        : support === 'ok' && (
          <div className="row spread" style={{ gap: 10 }}>
            <span className="small">{sub ? <><b>Alerts are on</b> for this device{devices > 1 ? ` (and ${devices - 1} more)` : ''}.</> : devices > 0 ? `Alerts are on for ${devices} other ${devices === 1 ? 'device' : 'devices'}.` : 'Get a tap on the shoulder when something good happens.'}</span>
            <div className="row" style={{ gap: 8 }}>
              {sub && <button type="button" className="btn ghost sm" onClick={test} disabled={pending}>Send a test</button>}
              {sub ? <button type="button" className="btn ghost sm" onClick={turnOff} disabled={pending}>Turn off here</button>
                : <button type="button" className="btn primary sm" onClick={turnOn} disabled={pending}>Turn on alerts</button>}
            </div>
          </div>
        )}
      {install && <button type="button" className="btn ghost sm" style={{ justifySelf: 'start' }} onClick={() => install.prompt().then(() => setInstall(null))}>Install the Porchlight app</button>}
      {note && <p className="small" role="status">{note}</p>}

      <fieldset className="alert-kinds">
        <legend className="label">Alert me about</legend>
        {ALERT_KINDS.map((k) => (
          <label key={k.key} className="check" htmlFor={`al-${k.key}`}>
            <input type="checkbox" id={`al-${k.key}`} checked={prefs[k.key]} onChange={() => toggle(k.key)} />
            <span><b>{k.label}</b><span className="small muted"> · {k.hint}</span></span>
          </label>
        ))}
      </fieldset>
      {prefs.alertNearby && (
        <div className="row" style={{ gap: 10 }}>
          <label htmlFor="al-radius" className="small">Within</label>
          <select id="al-radius" value={radius} style={{ width: 'auto' }} onChange={(e) => { const km = Number(e.target.value); setRadius(km); save(prefs, null, km); }}>
            {ALERT_RADII.map((r) => <option key={r} value={r}>{r} km</option>)}
          </select>
          <span className="small muted">of {spot ? 'my saved spot' : 'a spot you choose'}</span>
          <button type="button" className="btn ghost sm" onClick={useLocation} disabled={pending}>{spot ? 'Update to where I am' : 'Use where I am now'}</button>
          {spot && <button type="button" className="btn ghost sm" onClick={() => { setSpot(false); save(prefs, 'clear', radius); }} disabled={pending}>Forget spot</button>}
        </div>
      )}
    </div>
  );
}
