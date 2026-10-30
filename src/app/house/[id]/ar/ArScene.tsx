'use client';

import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { BASE_SIZE, getDecor, type Placement } from '@/lib/arDecor';
import styles from './ar.module.css';

/**
 * The 3:4 frame the host decorates and the visitor sees. Props sit at fractions of the frame, so the
 * same scene lines up on a laptop photo, a phone editor and a live camera view.
 */
export function ArScene({ placements, greeting, photo, ghost, shift, selected, onPropDown, onBackdropDown, children, className, style }: {
  placements: Placement[];
  greeting?: string | null;
  /** House photo behind the props. Leave out for the live camera, which shows through. */
  photo?: string | null;
  /** Show the photo faintly so a visitor can line it up with the real house. */
  ghost?: boolean;
  /** How far the props have slid as the phone turned, in fractions of the frame. */
  shift?: { dx: number; dy: number };
  selected?: number | null;
  onPropDown?: (i: number, e: ReactPointerEvent<HTMLButtonElement>) => void;
  onBackdropDown?: () => void;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const dx = shift?.dx ?? 0;
  const dy = shift?.dy ?? 0;
  return (
    <div className={`${styles.frame} ${className ?? ''}`} style={style} onPointerDown={onBackdropDown && ((e) => { if (e.target === e.currentTarget) onBackdropDown(); })}>
      {photo && <img src={photo} alt="" className={`${styles.photo} ${ghost ? styles.ghost : ''}`} draggable={false} />}
      {!photo && ghost && <span className={styles.corners} aria-hidden="true" />}
      <div className={styles.layer} style={{ translate: `${dx * 100}% ${dy * 100}%` }}>
        {greeting && <p className={styles.greeting}>{greeting}</p>}
        {placements.map((p, i) => {
          const d = getDecor(p.kind);
          if (!d) return null;
          const box: CSSProperties = { left: `${p.x * 100}%`, top: `${p.y * 100}%`, width: `${BASE_SIZE * p.scale * 100}%`, zIndex: i + 1 };
          const img = <img src={`/icons/3d/${d.icon}.webp`} alt="" draggable={false} className={styles[d.motion]} style={{ animationDelay: `${-(i * 0.37) % 2}s` }} />;
          return onPropDown ? (
            <button key={i} type="button" className={`${styles.prop} ${selected === i ? styles.selected : ''}`} style={box} onPointerDown={(e) => onPropDown(i, e)} aria-label={`${d.name}${selected === i ? ', selected' : ''}`}>
              {img}
            </button>
          ) : (
            <span key={i} className={styles.prop} style={box} aria-hidden="true">{img}</span>
          );
        })}
      </div>
      {children}
    </div>
  );
}
