import type { Icon3DName } from '@/components/Icon3D';
import type { Season } from './seasons';

/** The site-wide look: fonts and background texture in globals.css, keyed by `data-season`. */
export type SeasonLook = 'halloween' | 'christmas' | 'default';

/** Per-holiday colors for the hero house and the 3D icons that go with it. */
export type SeasonTheme = {
  look: SeasonLook;
  roof: string;
  roofDark: string;
  wall: string;
  wallMid: string;
  wallDark: string;
  icon: Icon3DName;
  sidekick: Icon3DName;
  /** Playful word for the winner, e.g. "The Spookiest house". */
  superlative: string;
  /** The holiday as it reads after "on", e.g. "the Fourth of July". */
  day: string;
};

const THEMES: Record<string, SeasonTheme> = {
  Halloween: { look: 'halloween', roof: '#FF6A1F', roofDark: '#E85A12', wall: '#6B3FD6', wallMid: '#4A33A8', wallDark: '#34247A', icon: 'pumpkin', sidekick: 'ghost', superlative: 'Spookiest', day: 'Halloween' },
  Christmas: { look: 'christmas', roof: '#E8364F', roofDark: '#B9223A', wall: '#1E9E6A', wallMid: '#17865A', wallDark: '#116646', icon: 'tree', sidekick: 'gift', superlative: 'Merriest', day: 'Christmas' },
  'Fourth of July': { look: 'default', roof: '#E8364F', roofDark: '#B9223A', wall: '#3D7BFF', wallMid: '#2E62D6', wallDark: '#2149A8', icon: 'fireworks', sidekick: 'party', superlative: 'Sparkliest', day: 'the Fourth of July' },
};

export const seasonTheme = (s: Pick<Season, 'name'>): SeasonTheme => THEMES[s.name] ?? THEMES.Halloween;
