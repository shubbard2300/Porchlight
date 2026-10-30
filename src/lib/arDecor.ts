import type { Icon3DName } from '@/components/Icon3D';

/**
 * AR porch decorations: hosts drop virtual props onto a photo of their house, and visitors standing
 * out front see the same props floating over their camera view. Positions are fractions of a 3:4
 * portrait frame (the same frame a phone camera shows), so the editor and the viewer line up.
 */
export type Motion = 'bob' | 'sway' | 'spin' | 'twinkle' | 'still';
export type Decor = { key: string; name: string; icon: Icon3DName; motion: Motion };

/** Props for each holiday. Hosts only get their own holiday's set, so a Christmas porch can't fill up with skulls. */
export const DECOR: Record<string, Decor[]> = {
  Halloween: [
    { key: 'ghost', name: 'Ghost', icon: 'ghost', motion: 'bob' },
    { key: 'pumpkin', name: 'Jack-o’-lantern', icon: 'pumpkin', motion: 'still' },
    { key: 'bat', name: 'Bat', icon: 'bat', motion: 'sway' },
    { key: 'spider', name: 'Spider', icon: 'spider', motion: 'bob' },
    { key: 'web', name: 'Cobweb', icon: 'web', motion: 'still' },
    { key: 'skull', name: 'Skull', icon: 'skull', motion: 'still' },
    { key: 'crystal', name: 'Crystal ball', icon: 'crystal', motion: 'twinkle' },
    { key: 'candle', name: 'Candle', icon: 'candle', motion: 'twinkle' },
    { key: 'owl', name: 'Owl', icon: 'owl', motion: 'sway' },
    { key: 'moon', name: 'Moon', icon: 'moon', motion: 'still' },
  ],
  Christmas: [
    { key: 'snowman', name: 'Snowman', icon: 'snowman', motion: 'still' },
    { key: 'tree', name: 'Tree', icon: 'tree', motion: 'still' },
    { key: 'star', name: 'Star', icon: 'star', motion: 'spin' },
    { key: 'gift', name: 'Present', icon: 'gift', motion: 'bob' },
    { key: 'deer', name: 'Reindeer', icon: 'deer', motion: 'sway' },
    { key: 'bell', name: 'Bell', icon: 'bell', motion: 'sway' },
    { key: 'snowflake', name: 'Snowflake', icon: 'snowflake', motion: 'spin' },
    { key: 'candy', name: 'Candy', icon: 'candy', motion: 'bob' },
    { key: 'ribbon', name: 'Bow', icon: 'ribbon', motion: 'still' },
    { key: 'candle', name: 'Candle', icon: 'candle', motion: 'twinkle' },
  ],
  Hanukkah: [
    { key: 'menorah', name: 'Menorah', icon: 'menorah', motion: 'twinkle' },
    { key: 'candle', name: 'Candle', icon: 'candle', motion: 'twinkle' },
    { key: 'star', name: 'Star', icon: 'star', motion: 'spin' },
    { key: 'gift', name: 'Present', icon: 'gift', motion: 'bob' },
    { key: 'dove', name: 'Dove', icon: 'dove', motion: 'sway' },
    { key: 'snowflake', name: 'Snowflake', icon: 'snowflake', motion: 'spin' },
  ],
  Thanksgiving: [
    { key: 'turkey', name: 'Turkey', icon: 'turkey', motion: 'sway' },
    { key: 'leaf', name: 'Maple leaf', icon: 'leaf', motion: 'sway' },
    { key: 'corn', name: 'Corn', icon: 'corn', motion: 'still' },
    { key: 'pie', name: 'Pie', icon: 'pie', motion: 'still' },
    { key: 'candle', name: 'Candle', icon: 'candle', motion: 'twinkle' },
    { key: 'moon', name: 'Harvest moon', icon: 'moon', motion: 'still' },
  ],
  Diwali: [
    { key: 'diya', name: 'Diya lamp', icon: 'diya', motion: 'twinkle' },
    { key: 'lotus', name: 'Lotus', icon: 'lotus', motion: 'bob' },
    { key: 'flower', name: 'Marigold', icon: 'flower', motion: 'sway' },
    { key: 'fireworks', name: 'Fireworks', icon: 'fireworks', motion: 'twinkle' },
    { key: 'sparkler', name: 'Sparkler', icon: 'sparkler', motion: 'twinkle' },
    { key: 'candle', name: 'Candle', icon: 'candle', motion: 'twinkle' },
  ],
  'Lunar New Year': [
    { key: 'lantern', name: 'Lantern', icon: 'lantern', motion: 'sway' },
    { key: 'dragon', name: 'Dragon', icon: 'dragon', motion: 'bob' },
    { key: 'envelope-red', name: 'Red envelope', icon: 'envelope-red', motion: 'bob' },
    { key: 'firecracker', name: 'Firecracker', icon: 'firecracker', motion: 'sway' },
    { key: 'fireworks', name: 'Fireworks', icon: 'fireworks', motion: 'twinkle' },
    { key: 'blossom', name: 'Plum blossom', icon: 'blossom', motion: 'sway' },
  ],
  Easter: [
    { key: 'rabbit', name: 'Bunny', icon: 'rabbit', motion: 'bob' },
    { key: 'egg', name: 'Egg', icon: 'egg', motion: 'bob' },
    { key: 'chick', name: 'Chick', icon: 'chick', motion: 'sway' },
    { key: 'tulip', name: 'Tulip', icon: 'tulip', motion: 'sway' },
    { key: 'blossom', name: 'Blossom', icon: 'blossom', motion: 'sway' },
    { key: 'ribbon', name: 'Bow', icon: 'ribbon', motion: 'still' },
  ],
  'Fourth of July': [
    { key: 'fireworks', name: 'Fireworks', icon: 'fireworks', motion: 'twinkle' },
    { key: 'sparkler', name: 'Sparkler', icon: 'sparkler', motion: 'twinkle' },
    { key: 'firecracker', name: 'Firecracker', icon: 'firecracker', motion: 'sway' },
    { key: 'star', name: 'Star', icon: 'star', motion: 'spin' },
    { key: 'ribbon', name: 'Bow', icon: 'ribbon', motion: 'still' },
  ],
};
/** Fits any holiday, so every set gets it. */
const SPARKLES: Decor = { key: 'sparkles', name: 'Sparkles', icon: 'sparkles', motion: 'twinkle' };
/** For a holiday without its own set yet. */
const FALLBACK: Decor[] = [{ key: 'bulb', name: 'Glowing bulb', icon: 'bulb', motion: 'twinkle' }, { key: 'star', name: 'Star', icon: 'star', motion: 'spin' }];

/** What a host can place for this holiday: that holiday's set plus sparkles. Nothing from other holidays. */
export function decorFor(holiday: string | undefined): Decor[] {
  return [...((holiday && DECOR[holiday]) || FALLBACK), SPARKLES];
}

const ALL = new Map([...Object.values(DECOR).flat(), ...FALLBACK, SPARKLES].map((d) => [d.key, d]));
export const getDecor = (key: string): Decor | undefined => ALL.get(key);

/** Most props a house can have, so the camera view stays readable. */
export const MAX_DECOR = 12;
export const MIN_SCALE = 0.4;
export const MAX_SCALE = 2.5;
/** A prop at scale 1 is this fraction of the frame's width. */
export const BASE_SIZE = 0.2;
const GREETING_HINTS: Record<string, string> = {
  Halloween: 'Happy haunting!', Christmas: 'Merry Christmas!', Hanukkah: 'Happy Hanukkah!', Thanksgiving: 'Happy Thanksgiving!',
  Diwali: 'Happy Diwali!', 'Lunar New Year': 'Happy New Year!', Easter: 'Happy Easter!', 'Fourth of July': 'Happy Fourth!',
};
/** Sample greeting for the editor's placeholder, in the holiday's spirit. */
export const greetingHint = (holiday: string | undefined) => (holiday && GREETING_HINTS[holiday]) || 'Welcome, neighbors!';

/** Longest greeting a host can float over their house. */
export const GREETING_MAX = 60;

export type Placement = { kind: string; x: number; y: number; scale: number };

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Only the props that belong to this holiday, e.g. after a host moves their entry to another holiday. */
export function forHoliday<P extends { kind: string }>(placements: P[], holiday: string | undefined): P[] {
  const allowed = new Set(decorFor(holiday).map((d) => d.key));
  return placements.filter((p) => allowed.has(p.kind));
}

/** Cleans up placements from the editor: this holiday's props only, positions inside the frame, sizes in range, capped count. */
export function cleanPlacements(input: Placement[], holiday: string | undefined): Placement[] {
  return forHoliday(input, holiday)
    .filter((p) => [p.x, p.y, p.scale].every(Number.isFinite))
    .slice(0, MAX_DECOR)
    .map((p) => ({
      kind: p.kind,
      x: Math.round(clamp(p.x, 0, 1) * 1000) / 1000,
      y: Math.round(clamp(p.y, 0, 1) * 1000) / 1000,
      scale: Math.round(clamp(p.scale, MIN_SCALE, MAX_SCALE) * 100) / 100,
    }));
}

/** Field of view we assume for a phone's back camera held upright, in degrees. */
export const H_FOV = 52;
export const V_FOV = 66;

/** Signed smallest difference a - b in degrees (-180 to 180). */
export function degDiff(a: number, b: number): number {
  return ((((a - b) % 360) + 540) % 360) - 180;
}

/**
 * How far to slide the props, as fractions of the frame, after the phone turned from where the
 * visitor lined things up. Turning right (alpha drops) slides them left; tilting up (beta rises)
 * slides them down, so they stay stuck to the house.
 */
export function panOffset(start: { alpha: number; beta: number }, now: { alpha: number; beta: number }) {
  return { dx: degDiff(now.alpha, start.alpha) / H_FOV, dy: (now.beta - start.beta) / V_FOV };
}
