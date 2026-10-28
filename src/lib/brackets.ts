import type { Icon3DName } from '@/components/Icon3D';

/**
 * Category brackets. Each house competes in one, so a small porch isn't up against a
 * 50,000-light show. They double as the theme filters on the map.
 * `holidays` limits a bracket to some holidays (by season name); without it the bracket is in every contest.
 */
export type Bracket = { key: string; label: string; blurb: string; icon: Icon3DName; holidays?: string[] };

export const BRACKETS: Bracket[] = [
  { key: 'spooky', label: 'Spooky Halloween', blurb: 'Graveyards, ghouls and good scares', icon: 'ghost', holidays: ['Halloween'] },
  { key: 'winter', label: 'Winter Wonderland', blurb: 'Snow, sparkle and North Pole magic', icon: 'snowman', holidays: ['Christmas'] },
  { key: 'patriotic', label: 'Red, White & Boom', blurb: 'Stars, stripes and fireworks', icon: 'fireworks', holidays: ['Fourth of July'] },
  { key: 'classic', label: 'Classic & Cozy', blurb: 'Timeless, warm and welcoming', icon: 'bulb' },
  { key: 'lightshow', label: 'Light Show', blurb: 'Synced to music, built to dazzle', icon: 'sparkles' },
  { key: 'inflatable', label: 'Inflatable Kingdom', blurb: 'The bigger and bouncier the better', icon: 'party' },
  { key: 'diy', label: 'Extreme DIY', blurb: 'Handmade builds and wild engineering', icon: 'gear' },
  { key: 'small', label: 'Small Porch', blurb: 'Apartments, stoops and tiny yards', icon: 'house' },
];

/** Brackets open in a contest, given the season's holiday name. */
export const bracketsFor = (holiday: string) => BRACKETS.filter((b) => !b.holidays || b.holidays.includes(holiday));

export const getBracket = (key: string | null | undefined) => BRACKETS.find((b) => b.key === key);
