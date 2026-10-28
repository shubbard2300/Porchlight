'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';
import { Icon3D, type Icon3DName } from '@/components/Icon3D';
import { angleDiff, screenX } from '@/lib/hunt';
import { catchCritter } from '../../../actions/hunt';
import styles from './hunt.module.css';

type Mode = 'intro' | 'compass' | 'drift' | 'caught';
type OrientationEvt = DeviceOrientationEvent & { webkitCompassHeading?: number };
type PermissionApi = { requestPermission?: () => Promise<'granted' | 'denied'> };

/**
 * The camera hunt. With a compass, the critter waits at its own bearing and drifts into view as you
 * turn; without one (most laptops), it floats around the screen. Either way, tap it to catch it.
 */
export function ArHunt({ houseId, houseName, critter, bearing }: { houseId: string; houseName: string; critter: { name: string; icon: Icon3DName; line: string }; bearing: number }) {
  const [mode, setMode] = useState<Mode>('intro');
  const [heading, setHeading] = useState<number | null>(null);
  const [drift, setDrift] = useState({ x: 0.5, y: 0.4 });
  const [camera, setCamera] = useState(true);
  const [result, setResult] = useState<{ xp: number; already: boolean } | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const smooth = useRef<number | null>(null);

  useEffect(() => () => stream.current?.getTracks().forEach((t) => t.stop()), []);

  // The <video> only exists once the hunt screen is up, so attach the camera then.
  const hunting = mode === 'compass' || mode === 'drift';
  useEffect(() => {
    const v = video.current;
    if (!hunting || !v || !stream.current || v.srcObject === stream.current) return;
    v.srcObject = stream.current;
    v.play().catch(() => {});
  }, [hunting]);

  // Compass: smooth the heading so the critter doesn't jitter.
  useEffect(() => {
    if (mode !== 'compass' && mode !== 'drift') return;
    const onOrient = (e: Event) => {
      const o = e as OrientationEvt;
      const raw = typeof o.webkitCompassHeading === 'number' ? o.webkitCompassHeading : o.absolute && o.alpha !== null ? 360 - o.alpha : null;
      if (raw === null) return;
      smooth.current = smooth.current === null ? raw : (smooth.current + angleDiff(raw, smooth.current) * 0.25 + 360) % 360;
      setHeading(smooth.current);
      setMode((m) => (m === 'drift' ? 'compass' : m));
    };
    addEventListener('deviceorientationabsolute', onOrient);
    addEventListener('deviceorientation', onOrient);
    return () => { removeEventListener('deviceorientationabsolute', onOrient); removeEventListener('deviceorientation', onOrient); };
  }, [mode]);

  // No compass: let the critter wander.
  useEffect(() => {
    if (mode !== 'drift') return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const s = (t - t0) / 1000;
      setDrift({ x: 0.5 + 0.36 * Math.sin(s * 0.7) * Math.cos(s * 0.23), y: 0.42 + 0.22 * Math.sin(s * 1.1 + 1) });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  const begin = async () => {
    setNote(null);
    const perm = (globalThis.DeviceOrientationEvent as unknown as PermissionApi | undefined)?.requestPermission;
    if (perm) await perm().catch(() => 'denied');
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    } catch {
      setCamera(false);
    }
    setMode('drift');
    // If a compass reports in, onOrient switches to compass mode; otherwise the critter keeps drifting.
  };

  const grab = () => start(async () => {
    const r = await catchCritter(houseId);
    if (!r.ok) { setNote(r.error); return; }
    stream.current?.getTracks().forEach((t) => t.stop());
    setResult(r);
    setMode('caught');
  });

  const x = mode === 'compass' && heading !== null ? screenX(bearing, heading) : mode === 'drift' ? drift.x : null;
  const hint = mode === 'compass' && heading !== null && x === null ? (angleDiff(bearing, heading) < 0 ? 'left' : 'right') : null;

  if (mode === 'intro') {
    return (
      <section className={`panel stack ${styles.intro}`}>
        <span className={styles.float}><Icon3D name={critter.icon} size={120} /></span>
        <span className="label">AR porch hunt · {houseName}</span>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 38px)' }}>{critter.name} is hiding nearby</h1>
        <p className="muted">{critter.line} Hold your phone up and turn slowly. When {critter.name} floats into view, tap to catch them.</p>
        <button type="button" className="btn primary" onClick={begin}>Start the hunt</button>
        <p className="small muted">We use your camera and compass only on this screen. Nothing is recorded or uploaded.</p>
      </section>
    );
  }

  if (mode === 'caught' && result) {
    return (
      <section className={`panel stack ${styles.intro}`}>
        <span className={`${styles.float} ${styles.caught}`}><Icon3D name={critter.icon} size={120} /></span>
        <span className="label">{result.already ? 'Already in your collection' : 'Caught!'}</span>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 38px)' }}>{critter.name} joined your collection</h1>
        {result.xp > 0 && <p className="num" style={{ fontSize: 20, fontWeight: 800 }}>+{result.xp} XP</p>}
        <div className="row" style={{ justifyContent: 'center' }}>
          <Link href="/hunt" className="btn primary">See my collection</Link>
          <Link href={`/house/${houseId}`} className="btn ghost">Back to {houseName}</Link>
        </div>
      </section>
    );
  }

  return (
    <div className={styles.stage} role="application" aria-label={`Find ${critter.name}`}>
      <video ref={video} className={styles.video} playsInline muted autoPlay hidden={!camera} />
      {!camera && <div className={styles.night} aria-hidden="true" />}
      <div className={styles.hud}>
        <Link href={`/house/${houseId}`} className={styles.close} aria-label="Stop the hunt">✕</Link>
        <span>{mode === 'compass' ? `Turn slowly to find ${critter.name}` : `${critter.name} is on the move. Tap to catch!`}</span>
      </div>
      {x !== null && (
        <button type="button" className={styles.critter} style={{ left: `${x * 100}%`, top: `${(mode === 'drift' ? drift.y : 0.42) * 100}%` }} onClick={grab} disabled={pending} aria-label={`Catch ${critter.name}`}>
          <Icon3D name={critter.icon} size={110} />
        </button>
      )}
      {hint && <div className={`${styles.hint} ${hint === 'left' ? styles.left : styles.right}`} aria-live="polite">{hint === 'left' ? '← Turn left' : 'Turn right →'}</div>}
      {note && <p className={styles.note} role="alert">{note}</p>}
    </div>
  );
}
