'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { degDiff, panOffset, type Placement } from '@/lib/arDecor';
import { openQuickLook, startWebXr, worldArSupport, type WebXrRun, type WorldArKind } from '@/lib/ar3d/worldAr';
import { ArCanvas3D } from './ArCanvas3D';
import { ArScene } from './ArScene';
import styles from './ar.module.css';

type Mode = 'intro' | 'align' | 'pinned' | 'snap';
type XrStatus = 'searching' | 'aim' | 'placed';
const XR_HINT: Record<XrStatus, string> = {
  searching: 'Move your phone slowly so it can find the ground…',
  aim: 'Point at the ground in front of the house and tap to place the props.',
  placed: 'Walk around! Tap the ground again to move them.',
};
const NO_PLACEMENTS: Placement[] = [];
type Tilt = { alpha: number; beta: number };
type PermissionApi = { requestPermission?: () => Promise<'granted' | 'denied'> };

/**
 * The visitor's camera view, with the host's props as 3D models. In the camera view they line the
 * host's photo up with the real house and tap Pin; from then on the phone's gyroscope turns the
 * virtual camera with the real one, so the props stay on the house. Phones with world-tracked AR
 * (WebXR on Android, AR Quick Look on iPhone) can also anchor the props in space and walk around them.
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
  const gl = useRef<HTMLCanvasElement | null>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const xrRun = useRef<WebXrRun | null>(null);
  const [frameH, setFrameH] = useState(0);
  const [worldAr, setWorldAr] = useState<WorldArKind>(null);
  const [xrStatus, setXrStatus] = useState<XrStatus>('searching');
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => { worldArSupport().then(setWorldAr); }, []);
  useEffect(() => () => xrRun.current?.end(), []);

  // The 3D props fill the screen; they line up with the 3:4 frame in the middle of it.
  useEffect(() => {
    const f = frame.current;
    if (!f) return;
    const ro = new ResizeObserver(() => setFrameH(f.getBoundingClientRect().height));
    ro.observe(f);
    return () => ro.disconnect();
  }, [mode]);

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
    const c3 = gl.current;
    if (c3) {
      // The 3D canvas covers the screen too; copy the part over the frame.
      const cb = c3.getBoundingClientRect();
      const kx = c3.width / cb.width;
      const ky = c3.height / cb.height;
      g.drawImage(c3, (box.left - cb.left) * kx, (box.top - cb.top) * ky, box.width * kx, box.height * ky, 0, 0, W, H);
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

  const placeInAr = async () => {
    setNote(null);
    if (worldAr === 'quicklook') {
      await openQuickLook(placements, greeting, houseName).catch(() => setNote('AR Quick Look couldn’t open. Try the camera view instead.'));
      return;
    }
    const root = overlay.current;
    if (!root) return;
    root.style.display = 'block';
    setXrStatus('searching');
    try {
      xrRun.current = await startWebXr({
        placements,
        greeting,
        overlay: root,
        onStatus: setXrStatus,
        onEnd: () => {
          xrRun.current = null;
          root.style.display = 'none';
        },
      });
    } catch {
      root.style.display = 'none';
      setNote('This phone couldn’t start AR. Try the camera view instead.');
    }
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
        <ArScene placements={NO_PLACEMENTS} photo={photo} className={styles.preview}>
          <ArCanvas3D placements={placements} greeting={greeting} className={styles.gl} />
        </ArScene>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn primary" onClick={begin}>Open my camera</button>
          {worldAr && <button type="button" className="btn ghost" onClick={placeInAr}>Place in AR and walk around</button>}
        </div>
        {note && <p className="notice warn small" role="alert">{note}</p>}
        <p className="small muted">{worldAr ? '“Place in AR” anchors the props in real space, so they stay put as you walk around. ' : ''}We use your camera and motion sensor only on this screen. Nothing is recorded or uploaded unless you save a photo.</p>
        <div ref={overlay} className={styles.xrOverlay} style={{ display: 'none' }}>
          <div className={styles.hud}>
            <button type="button" className={styles.close} aria-label="Leave AR" onClick={() => xrRun.current?.end()}>✕</button>
            <span>{XR_HINT[xrStatus]}</span>
          </div>
        </div>
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
        <ArScene placements={NO_PLACEMENTS} photo={mode === 'align' ? photo : null} ghost={mode === 'align'} className={styles.live} />
      </div>
      <ArCanvas3D placements={placements} greeting={greeting} live shift={shift} frameHeight={frameH} onCanvas={(c) => { gl.current = c; }} className={styles.glLive} />
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
