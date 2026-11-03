import type { CSSProperties } from 'react';
import type { SeasonTheme } from '@/lib/theme';

/** Nested outlines of the tree, scaled about its middle like rings of light around the porch lamp. */
const TREE = 'M100 52 L140 150 H60 Z';
const TREE_RINGS = [1.28, 1.6, 1.96, 2.36];

/**
 * The home hero's artwork, beside a colour code taken from the holiday's palette. Flat, geometric and quiet on purpose.
 * Most holidays get one porch light: a lit disc with rings of light spreading out. Christmas gets a tree drawn the same way.
 * Pure decoration, so it is hidden from screen readers.
 */
export function HeroLight({ theme, code }: { theme: SeasonTheme; code: string }) {
  const bands = [theme.roof, theme.roofDark, theme.wall, theme.wallDark];
  return (
    <div className="hero-light" aria-hidden="true" style={{ '--season-roof': theme.roof } as CSSProperties}>
      {theme.look === 'christmas' ? (
        <svg className="lamp lamp-tree" viewBox="0 0 200 200">
          {TREE_RINGS.map((s, i) => (
            <path key={s} d={TREE} transform={`translate(100 117) scale(${s}) translate(-100 -117)`} vectorEffect="non-scaling-stroke"
              fill="none" stroke="var(--amber)" strokeWidth="1" opacity={[0.7, 0.45, 0.25, 0.12][i]} />
          ))}
          <path d={TREE} fill={theme.wall} />
          <rect x="94" y="150" width="12" height="14" fill={theme.wallDark} />
          <circle cx="100" cy="46" r="8" fill="var(--amber)" className="tree-star" />
        </svg>
      ) : (
        <div className="lamp">
          <i /><i /><i /><i />
          <b />
        </div>
      )}
      <ol className="colour-code">
        {bands.map((c, i) => <li key={i} style={{ background: c }} />)}
      </ol>
      <span className="hero-code">{code}</span>
    </div>
  );
}
