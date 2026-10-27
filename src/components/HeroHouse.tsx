import type { CSSProperties } from 'react';
import type { SeasonTheme } from '@/lib/theme';
import { Icon3D } from './Icon3D';

const BULBS = ['#FF4D8D', '#FFB000', '#B9A6FF', '#FFF4E4', '#FF4D8D', '#FFB000', '#B9A6FF', '#FFF4E4'];

/** A small CSS-3D house that sways and twinkles. Pure decoration, so it is hidden from screen readers. */
export function HeroHouse({ theme }: { theme: SeasonTheme }) {
  const vars = {
    '--roof': theme.roof,
    '--roof-dark': theme.roofDark,
    '--wall': theme.wall,
    '--wall-mid': theme.wallMid,
    '--wall-dark': theme.wallDark,
  } as CSSProperties;
  return (
    <div className="hero-art" aria-hidden="true" style={vars}>
      <div className="diorama-scene">
        <div className="diorama">
          <div className="d-ground" />
          <div className="d-back" />
          <div className="d-left" />
          <div className="d-right" />
          <div className="d-front">
            <span className="d-win" style={{ left: 22 }} />
            <span className="d-win" style={{ right: 22 }} />
            <span className="d-door" />
            <span className="d-attic" />
            <span className="d-bulbs">{BULBS.map((c, i) => <i key={i} style={{ background: c }} />)}</span>
          </div>
          <div className="d-roof-l" />
          <div className="d-roof-r" />
        </div>
      </div>
      <Icon3D name={theme.icon} size={84} className="float a" />
      <Icon3D name={theme.sidekick} size={64} className="float b" />
      <Icon3D name="moon" size={56} className="float c" />
    </div>
  );
}
