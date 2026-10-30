import type { Icon3DName } from '@/components/Icon3D';

/**
 * AR porch decorations: hosts drop virtual props onto a photo of their house, and visitors standing
 * out front see the same props floating over their camera view. Positions are fractions of a 3:4
 * portrait frame (the same frame a phone camera shows), so the editor and the viewer line up.
 */
export type Motion = 'bob' | 'sway' | 'spin' | 'twinkle' | 'still';
export type Decor = { key: string; name: string; icon: Icon3DName; motion: Motion };

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
  'Fourth of July': [
    { key: 'fireworks', name: 'Fireworks', icon: 'fireworks', motion: 'twinkle' },
    { key: 'sparkler', name: 'Sparkler', icon: 'sparkler', motion: 'twinkle' },
    { key: 'firecracker', name: 'Firecracker', icon: 'firecracker', motion: 'sway' },
    { key: 'star', name: 'Star', icon: 'star', motion: 'spin' },
  ],
};
const EVERYDAY: Decor[] = [
  { key: 'sparkles', name: 'Sparkles', icon: 'sparkles', motion: 'twinkle' },
  { key: 'bulb', name: 'Glowing bulb', icon: 'bulb', motion: 'twinkle' },
  { key: 'heart', name: 'Heart', icon: 'heart', motion: 'bob' },
];

/** What a host can place for this holiday: the holiday set first, then a few that suit any season. */
export function decorFor(holiday: string | undefined): Decor[] {
  const own = (holiday && DECOR[holiday]) || [];
  return [...own, ...EVERYDAY.filter((e) => !own.some((d) => d.key === e.key))];
}

const ALL = new Map([...Object.values(DECOR).flat(), ...EVERYDAY].map((d) => [d.key, d]));
export const getDecor = (key: string): Decor | undefined => ALL.get(key);

/** Most props a house can have, so the camera view stays readable. */
export const MAX_DECOR = 12;
export const MIN_SCALE = 0.4;
export const MAX_SCALE = 2.5;
/** A prop at scale 1 is this fraction of the frame's width. */
export const BASE_SIZE = 0.2;
/** Longest greeting a host can float over their house. */
export const GREETING_MAX = 60;

export type Placement = { kind: string; x: number; y: number; scale: number };

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Cleans up placements from the editor: known props only, positions inside the frame, sizes in range, capped count. */
export function cleanPlacements(input: Placement[]): Placement[] {
  return input
    .filter((p) => getDecor(p.kind) && [p.x, p.y, p.scale].every(Number.isFinite))
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
