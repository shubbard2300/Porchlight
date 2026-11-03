import type { CSSProperties } from 'react';
import type { SeasonTheme } from '@/lib/theme';

/**
 * The home hero's artwork: one porch light, drawn as a lit disc with rings of light spreading out,
 * beside a colour code taken from the holiday's palette. Flat, geometric and quiet on purpose.
 * Pure decoration, so it is hidden from screen readers.
 */
export function HeroLight({ theme, code }: { theme: SeasonTheme; code: string }) {
  const bands = [theme.roof, theme.roofDark, theme.wall, theme.wallDark];
  return (
    <div className="hero-light" aria-hidden="true" style={{ '--season-roof': theme.roof } as CSSProperties}>
      <div className="lamp">
        <i /><i /><i /><i />
        <b />
      </div>
      <ol className="colour-code">
        {bands.map((c, i) => <li key={i} style={{ background: c }} />)}
      </ol>
      <span className="hero-code">{code}</span>
    </div>
  );
}
