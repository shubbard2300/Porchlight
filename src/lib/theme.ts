import type { Icon3DName } from '@/components/Icon3D';
import type { HolidayKey } from './holidays';
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

const THEMES: Record<HolidayKey, SeasonTheme> = {
  valentines: { look: 'default', roof: '#FF4F8B', roofDark: '#D93A72', wall: '#8E3FD6', wallMid: '#7233B0', wallDark: '#55247F', icon: 'heart', sidekick: 'sparkles', superlative: 'Sweetest', day: "Valentine's Day" },
  lunarnewyear: { look: 'default', roof: '#E8364F', roofDark: '#B9223A', wall: '#E8A21F', wallMid: '#C98714', wallDark: '#9A660C', icon: 'fireworks', sidekick: 'envelope', superlative: 'Luckiest', day: 'Lunar New Year' },
  stpatricks: { look: 'default', roof: '#1FA45B', roofDark: '#17864A', wall: '#2E7D5B', wallMid: '#246548', wallDark: '#194A35', icon: 'star', sidekick: 'money', superlative: 'Luckiest', day: "St. Patrick's Day" },
  easter: { look: 'default', roof: '#B48CFF', roofDark: '#9670E0', wall: '#3FB8A8', wallMid: '#32998B', wallDark: '#24736A', icon: 'sparkles', sidekick: 'heart', superlative: 'Brightest', day: 'Easter' },
  july4: { look: 'default', roof: '#E8364F', roofDark: '#B9223A', wall: '#3D7BFF', wallMid: '#2E62D6', wallDark: '#2149A8', icon: 'fireworks', sidekick: 'party', superlative: 'Sparkliest', day: 'the Fourth of July' },
  halloween: { look: 'halloween', roof: '#FF6A1F', roofDark: '#E85A12', wall: '#6B3FD6', wallMid: '#4A33A8', wallDark: '#34247A', icon: 'pumpkin', sidekick: 'ghost', superlative: 'Spookiest', day: 'Halloween' },
  diwali: { look: 'default', roof: '#FFB020', roofDark: '#E0920F', wall: '#C2367A', wallMid: '#A02A63', wallDark: '#771E4A', icon: 'bulb', sidekick: 'sparkles', superlative: 'Brightest', day: 'Diwali' },
  thanksgiving: { look: 'default', roof: '#D9822B', roofDark: '#B5671C', wall: '#8A5A3B', wallMid: '#70482F', wallDark: '#523422', icon: 'house', sidekick: 'people', superlative: 'Coziest', day: 'Thanksgiving' },
  hanukkah: { look: 'default', roof: '#4A8BFF', roofDark: '#346FD6', wall: '#E8EEF8', wallMid: '#C7D3E6', wallDark: '#9AABC6', icon: 'star', sidekick: 'bulb', superlative: 'Brightest', day: 'Hanukkah' },
  christmas: { look: 'christmas', roof: '#E8364F', roofDark: '#B9223A', wall: '#1E9E6A', wallMid: '#17865A', wallDark: '#116646', icon: 'tree', sidekick: 'gift', superlative: 'Merriest', day: 'Christmas' },
};

export const seasonTheme = (s: Pick<Season, 'holiday'>): SeasonTheme => THEMES[s.holiday] ?? THEMES.halloween;
