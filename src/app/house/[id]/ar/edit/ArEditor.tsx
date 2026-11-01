'use client';

import Link from 'next/link';
import { useRef, useState, useTransition, type PointerEvent as ReactPointerEvent } from 'react';
import { GREETING_MAX, MAX_DECOR, MAX_SCALE, MIN_SCALE, getDecor, type Decor, type Placement } from '@/lib/arDecor';
import { saveArScene } from '../../../../actions/arDecor';
import { ArCanvas3D } from '../ArCanvas3D';
import { ArScene } from '../ArScene';
import styles from '../ar.module.css';

const NONE: Placement[] = [];

/** Tap a prop to drop it on the porch, drag it into place, resize it, then save for visitors. */
export function ArEditor({ houseId, photo, palette, initial, initialGreeting, greetingHint }: { houseId: string; photo: string | null; palette: Decor[]; initial: Placement[]; initialGreeting: string; greetingHint: string }) {
  const [items, setItems] = useState<Placement[]>(initial);
  const [greeting, setGreeting] = useState(initialGreeting);
  const [selected, setSelected] = useState<number | null>(null);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();
  const [preview3d, setPreview3d] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ i: number; ox: number; oy: number } | null>(null);

  const change = (next: Placement[]) => { setItems(next); setDirty(true); setStatus(null); };
  const full = items.length >= MAX_DECOR;

  const add = (d: Decor) => {
    if (full) return;
    // Stagger new props so a few taps in a row don't stack on one spot.
    const n = items.length;
    const p = { kind: d.key, x: 0.5 + ((n % 3) - 1) * 0.18, y: 0.55 + ((Math.floor(n / 3) % 3) - 1) * 0.12, scale: 1 };
    change([...items, p]);
    setSelected(n);
  };

  const onPropDown = (i: number, e: ReactPointerEvent<HTMLButtonElement>) => {
    const box = frame.current?.getBoundingClientRect();
    if (!box) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setSelected(i);
    drag.current = { i, ox: (e.clientX - box.left) / box.width - items[i].x, oy: (e.clientY - box.top) / box.height - items[i].y };
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const box = frame.current?.getBoundingClientRect();
    if (!d || !box) return;
    const x = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width - d.ox));
    const y = Math.min(1, Math.max(0, (e.clientY - box.top) / box.height - d.oy));
    change(items.map((p, j) => (j === d.i ? { ...p, x, y } : p)));
  };
  const onUp = () => { drag.current = null; };

  const resize = (f: number) => selected !== null && change(items.map((p, j) => (j === selected ? { ...p, scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round(p.scale * f * 100) / 100)) } : p)));
  const toFront = () => {
    if (selected === null) return;
    change([...items.filter((_, j) => j !== selected), items[selected]]);
    setSelected(items.length - 1);
  };
  const remove = () => {
    if (selected === null) return;
    change(items.filter((_, j) => j !== selected));
    setSelected(null);
  };

  const save = () => start(async () => {
    const r = await saveArScene(houseId, { placements: items, greeting });
    if (!r.ok) { setStatus({ ok: false, text: r.error }); return; }
    setDirty(false);
    setStatus({ ok: true, text: r.count ? `Saved. Visitors will see ${r.count} magic ${r.count === 1 ? 'decoration' : 'decorations'} through their camera.` : 'Saved. Your house has no magic decorations right now.' });
  });

  const sel = selected !== null ? getDecor(items[selected]?.kind ?? '') : undefined;

  return (
    <div className={styles.editor}>
      <div className={styles.stageCol}>
        <div ref={frame} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          {preview3d ? (
            <ArScene placements={NONE} photo={photo}>
              <ArCanvas3D placements={items} greeting={greeting.trim() || null} className={styles.gl} />
            </ArScene>
          ) : (
            <ArScene placements={items} greeting={greeting.trim() || null} photo={photo} selected={selected} onPropDown={onPropDown} onBackdropDown={() => setSelected(null)} />
          )}
        </div>
        <div className={styles.toolbar} role="toolbar" aria-label="Selected prop">
          {preview3d ? (
            <>
              <span className="small muted" style={{ marginRight: 'auto' }}>This is how your props look in 3D to visitors.</span>
              <button type="button" className="btn sm ghost" onClick={() => setPreview3d(false)}>Back to editing</button>
            </>
          ) : sel ? (
            <>
              <b className="small" style={{ marginRight: 'auto' }}>{sel.name}</b>
              <button type="button" className="btn sm ghost" onClick={() => resize(1 / 1.2)} aria-label="Smaller">−</button>
              <button type="button" className="btn sm ghost" onClick={() => resize(1.2)} aria-label="Bigger">+</button>
              <button type="button" className="btn sm ghost" onClick={toFront}>To front</button>
              <button type="button" className="btn sm ghost" onClick={remove}>Remove</button>
            </>
          ) : (
            <>
              <span className="small muted" style={{ marginRight: 'auto' }}>{items.length ? 'Tap a prop to move, resize or remove it.' : 'Pick a prop from the set to drop it on your porch.'}</span>
              {items.length > 0 && <button type="button" className="btn sm ghost" onClick={() => { setSelected(null); setPreview3d(true); }}>3D preview</button>}
            </>
          )}
        </div>
        {!photo && <p className="small muted">Add a house photo from your profile so you can place props right where they belong. Visitors line the photo up with your real house.</p>}
      </div>

      <div className="stack" style={{ gap: 18 }}>
        <section className="panel stack" aria-labelledby="props">
          <div className="row spread">
            <h2 id="props" style={{ fontSize: 20 }}>Add props</h2>
            <span className="pill">{items.length} of {MAX_DECOR}</span>
          </div>
          <div className={styles.palette}>
            {palette.map((d) => (
              <button key={d.key} type="button" className={styles.tile} onClick={() => add(d)} disabled={full}>
                <img src={`/icons/3d/${d.icon}.webp`} alt="" />
                {d.name}
              </button>
            ))}
          </div>
          {full && <p className="small muted">That’s the limit. Remove one to add another.</p>}
        </section>

        <section className="panel stack" aria-labelledby="greet">
          <h2 id="greet" style={{ fontSize: 20 }}>Floating greeting</h2>
          <label className="stack" style={{ gap: 6 }}>
            <span className="small muted">Optional. Shows over your house, like a sign in the sky.</span>
            <input value={greeting} maxLength={GREETING_MAX} placeholder={greetingHint} onChange={(e) => { setGreeting(e.target.value); setDirty(true); setStatus(null); }} />
          </label>
        </section>

        <div className="row" style={{ gap: 10, alignItems: 'center' }}>
          <button type="button" className="btn primary" onClick={save} disabled={pending || !dirty}>{pending ? 'Saving…' : dirty ? 'Save decorations' : 'Saved'}</button>
          <Link href={`/house/${houseId}/ar`} className="btn ghost">Preview as a visitor</Link>
        </div>
        {status && <p className={`notice ${status.ok ? 'ok' : 'warn'}`} role="status">{status.text}</p>}
      </div>
    </div>
  );
}
