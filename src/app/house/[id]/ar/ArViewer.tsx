'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { BASE_SIZE, degDiff, getDecor, panOffset, type Placement } from '@/lib/arDecor';
import { ArScene } from './ArScene';
import styles from './ar.module.css';

type Mode = 'intro' | 'align' | 'pinned' | 'snap';
type Tilt = { alpha: number; beta: number };
type PermissionApi = { requestPermission?: () => Promise<'granted' | 'denied'> };

/**
 * The visitor's camera view. They line the host's photo up with the real house and tap Pin; from
 * then on the phone's gyroscope slides the props as they look around, so they stay on the house.
 */
export function ArViewer({ houseId, houseName, photo, placements, greeting }: { houseId: string; houseName: string; photo: string | null; placements: Placement[]; greeting: string | null }) {
  const [mode, setMode] = useState<Mode>('intro');
  const [camera, setCamera] = useState(true);
  const [shift, setShift] = useState({ dx: 0, dy: 0 });
  const [gyro, setGyro] = useState(false);
  const [shot, setShot] = useState<{ url: string; blob: Blob } | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  const tilt = useRef<Tilt | null>(null);
  const anchor = useRef<Tilt | null>(null);

  const stop = () => stream.current?.getTracks().forEach((t) => t.stop());
  useEffect(() => stop, []);
  useEffect(() => () => { if (shot) URL.revokeObjectURL(shot.url); }, [shot]);

  const live = mode === 'align' || mode === 'pinned';
  useEffect(() => {
    const v = video.current;
    if (!live || !v || !stream.current || v.srcObject === stream.current) return;
    v.srcObject = stream.current;
    v.play().catch(() => {});
  }, [live]);

  // Track how the phone is held; once pinned, slide the props against the motion.
  useEffect(() => {
    if (!live) return;
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.alpha === null || e.beta === null) return;
      const prev = tilt.current;
      // Light smoothing so hand shake doesn't make the props jitter.
      tilt.current = prev ? { alpha: (prev.alpha + degDiff(e.alpha, prev.alpha) * 0.3 + 360) % 360, beta: prev.beta + (e.beta - prev.beta) * 0.3 } : { alpha: e.alpha, beta: e.beta };
      setGyro(true);
      if (anchor.current) setShift(panOffset(anchor.current, tilt.current));
    };
    addEventListener('deviceorientation', onOrient);
    return () => removeEventListener('deviceorientation', onOrient);
  }, [live]);

  const begin = async () => {
    const perm = (globalThis.DeviceOrientationEvent as unknown as PermissionApi | undefined)?.requestPermission;
    if (perm) await perm().catch(() => 'denied');
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    } catch {
      setCamera(false);
    }
    anchor.current = null;
    setShift({ dx: 0, dy: 0 });
    setMode('align');
  };

  const pin = () => {
    anchor.current = tilt.current;
    setShift({ dx: 0, dy: 0 });
    setMode('pinned');
  };

  const realign = () => {
    anchor.current = null;
    setShift({ dx: 0, dy: 0 });
    setMode('align');
  };

  /** Bakes the camera frame and the props into one picture the visitor can keep or share. */
  const snap = async () => {
    const v = video.current;
    const f = frame.current;
    if (!f) return;
    const box = f.getBoundingClientRect();
    const scale = Math.min(2, devicePixelRatio || 1);
    const W = Math.round(box.width * scale);
    const H = Math.round(box.height * scale);
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    if (!g) return;
    g.fillStyle = '#0b0a24';
    g.fillRect(0, 0, W, H);
    if (v && camera && v.videoWidth) {
      // The video covers the whole screen; copy the part behind the frame.
      const vb = v.getBoundingClientRect();
      const k = Math.max(vb.width / v.videoWidth, vb.height / v.videoHeight);
      const ox = vb.left + (vb.width - v.videoWidth * k) / 2;
      const oy = vb.top + (vb.height - v.videoHeight * k) / 2;
      g.drawImage(v, (box.left - ox) / k, (box.top - oy) / k, box.width / k, box.height / k, 0, 0, W, H);
    }
    const icons = await Promise.all(placements.map((p) => new Promise<HTMLImageElement | null>((res) => {
      const d = getDecor(p.kind);
      if (!d) return res(null);
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = `/icons/3d/${d.icon}.webp`;
    })));
    g.shadowColor = 'rgba(255, 201, 74, 0.6)';
    g.shadowBlur = 14 * scale;
    placements.forEach((p, i) => {
      const img = icons[i];
      if (!img) return;
      const s = BASE_SIZE * p.scale * W;
      g.drawImage(img, (p.x + shift.dx) * W - s / 2, (p.y + shift.dy) * H - s / 2, s, s);
    });
    g.shadowBlur = 0;
    if (greeting) {
      g.font = `800 ${Math.round(W * 0.06)}px system-ui, sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      const tx = (0.5 + shift.dx) * W;
      const ty = (0.08 + shift.dy) * H;
      const tw = Math.min(W * 0.88, g.measureText(greeting).width + W * 0.08);
      g.fillStyle = 'rgba(11, 10, 36, 0.72)';
      g.beginPath();
      g.roundRect(tx - tw / 2, ty - W * 0.05, tw, W * 0.1, W * 0.05);
      g.fill();
      g.fillStyle = '#fff4e4';
      g.fillText(greeting, tx, ty, W * 0.82);
    }
    g.font = `700 ${Math.round(W * 0.032)}px system-ui, sans-serif`;
    g.textAlign = 'right';
    g.textBaseline = 'bottom';
    g.fillStyle = 'rgba(255, 244, 228, 0.85)';
    g.fillText(`${houseName} · porchlightcontest.com`, W - W * 0.03, H - W * 0.03);
    c.toBlob((blob) => {
      if (!blob) return;
      stop();
      setShot({ url: URL.createObjectURL(blob), blob });
      setMode('snap');
    }, 'image/jpeg', 0.9);
  };

  const share = async () => {
    if (!shot) return;
    const file = new File([shot.blob], 'porchlight-ar.jpg', { type: 'image/jpeg' });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.canShare?.({ files: [file] })) await nav.share({ files: [file], title: houseName }).catch(() => {});
    else {
      const a = document.createElement('a');
      a.href = shot.url;
      a.download = file.name;
      a.click();
    }
  };

  if (mode === 'intro') {
    return (
      <section className="panel stack" style={{ gap: 16, textAlign: 'center', justifyItems: 'center', padding: '28px 20px' }}>
        <span className="label">AR decorations · {houseName}</span>
        <h1 style={{ fontSize: 'clamp(26px, 5vw, 36px)' }}>See the magic you can’t see</h1>
        <p className="muted" style={{ maxWidth: 460 }}>The host added {placements.length === 1 ? 'a virtual prop' : `${placements.length} virtual props`} to their display. Stand out front, point your phone at the house and line it up with the outline.</p>
        <ArScene placements={placements} greeting={greeting} photo={photo} className={styles.preview} />
        <button type="button" className="btn primary" onClick={begin}>Open my camera</button>
        <p className="small muted">We use your camera and motion sensor only on this screen. Nothing is recorded or uploaded unless you save a photo.</p>
      </section>
    );
  }

  if (mode === 'snap' && shot) {
    return (
      <section className={`panel ${styles.snapWrap}`} style={{ padding: '24px 20px' }}>
        <span className="label">Your AR photo</span>
        <img src={shot.url} alt={`${houseName} with AR decorations`} className={styles.snap} />
        <div className="row" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn primary" onClick={share}>Save or share</button>
          <button type="button" className="btn ghost" onClick={begin}>Back to the camera</button>
          <Link href={`/house/${houseId}`} className="btn ghost">Back to {houseName}</Link>
        </div>
      </section>
    );
  }

  return (
    <div className={styles.stage} role="application" aria-label={`${houseName} in AR`}>
      <video ref={video} className={styles.video} playsInline muted autoPlay hidden={!camera} />
      {!camera && <div className={styles.night} aria-hidden="true" />}
      <div className={styles.hud}>
        <Link href={`/house/${houseId}`} className={styles.close} aria-label="Close the camera" onClick={stop}>✕</Link>
        <span>{mode === 'align' ? (photo ? 'Line the outline up with the house' : 'Center the house in the frame') : gyro ? 'Look around, the props stay put' : 'Hold steady and enjoy the show'}</span>
      </div>
      <div ref={frame} className={styles.liveWrap}>
        <ArScene placements={placements} greeting={greeting} photo={mode === 'align' ? photo : null} ghost={mode === 'align'} shift={shift} className={styles.live} />
      </div>
      {!camera && <p className={styles.note} role="status">We couldn’t open the camera, so here’s the display on its own. Check your browser’s camera permission to see it on the real house.</p>}
      <div className={styles.dock}>
        {mode === 'align' ? (
          <button type="button" className="btn primary" onClick={pin}>Pin it here</button>
        ) : (
          <>
            <button type="button" className="btn ghost" onClick={realign}>Re-align</button>
            <button type="button" className="btn primary" onClick={snap}>Take a photo</button>
          </>
        )}
      </div>
    </div>
  );
}
