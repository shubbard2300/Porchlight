import type { Icon3DName } from '@/components/Icon3D';
import type { Season } from './seasons';

/** Per-holiday colors for the hero house and the 3D icons that go with it. */
export type SeasonTheme = {
  roof: string;
  roofDark: string;
  wall: string;
  wallMid: string;
  wallDark: string;
  icon: Icon3DName;
  sidekick: Icon3DName;
};

const THEMES: Record<string, SeasonTheme> = {
  Halloween: { roof: '#FF6A1F', roofDark: '#E85A12', wall: '#6B3FD6', wallMid: '#4A33A8', wallDark: '#34247A', icon: 'pumpkin', sidekick: 'ghost' },
  Christmas: { roof: '#E8364F', roofDark: '#B9223A', wall: '#1E9E6A', wallMid: '#17865A', wallDark: '#116646', icon: 'tree', sidekick: 'gift' },
  'Fourth of July': { roof: '#E8364F', roofDark: '#B9223A', wall: '#3D7BFF', wallMid: '#2E62D6', wallDark: '#2149A8', icon: 'fireworks', sidekick: 'party' },
};

export const seasonTheme = (s: Pick<Season, 'name'>): SeasonTheme => THEMES[s.name] ?? THEMES.Halloween;
