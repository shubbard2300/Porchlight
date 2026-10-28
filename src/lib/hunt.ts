import type { Icon3DName } from '@/components/Icon3D';

/**
 * AR porch hunts: every live house has a critter hiding somewhere around the visitor. After checking
 * in, they open the camera, turn until it floats into view and tap to catch it.
 */
export type Critter = { key: string; name: string; kind: string; icon: Icon3DName; line: string };

export const CRITTERS: Record<string, Critter[]> = {
  Halloween: [
    { key: 'wisp', kind: 'ghost', name: 'Wisp', icon: 'ghost', line: 'A shy little ghost who loves fog machines.' },
    { key: 'jack', kind: 'jack-o’-lantern', name: 'Jack', icon: 'pumpkin', line: 'A jack-o’-lantern who never stops grinning.' },
    { key: 'hoot', kind: 'owl', name: 'Hoot', icon: 'owl', line: 'A night owl keeping watch over the porch.' },
  ],
  Christmas: [
    { key: 'flurry', kind: 'snowman', name: 'Flurry', icon: 'snowman', line: 'A snowman who sneaks away to see the lights.' },
    { key: 'twinkle', kind: 'star', name: 'Twinkle', icon: 'star', line: 'A runaway tree-topper star.' },
    { key: 'bow', kind: 'present', name: 'Bow', icon: 'gift', line: 'A present that unwraps itself.' },
    { key: 'spruce', kind: 'little tree', name: 'Spruce', icon: 'tree', line: 'A tiny tree that wandered off the lot.' },
  ],
  'Fourth of July': [
    { key: 'sparky', kind: 'firework', name: 'Sparky', icon: 'fireworks', line: 'A firework that can’t wait for dark.' },
    { key: 'glory', kind: 'star', name: 'Glory', icon: 'star', line: 'A star that slipped off the flag.' },
  ],
};
const FALLBACK: Critter[] = [{ key: 'glim', kind: 'porch light', name: 'Glim', icon: 'bulb', line: 'A porch light with a mind of its own.' }];

/** Small stable hash so the same house always hides the same critter, and each visitor finds it in their own direction. */
export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function critterFor(houseId: string, holiday: string | undefined): Critter {
  const pool = (holiday && CRITTERS[holiday]) || FALLBACK;
  return pool[hash(houseId) % pool.length];
}

export const getCritter = (key: string): Critter | undefined => Object.values(CRITTERS).flat().concat(FALLBACK).find((c) => c.key === key);

/** Compass bearing (0 to 359) where this visitor's critter hides at this house. */
export const bearingFor = (houseId: string, userId: string) => hash(`${houseId}:${userId}`) % 360;

/** Signed smallest difference from heading to bearing, in degrees (-180 to 180). */
export function angleDiff(bearing: number, heading: number): number {
  return ((((bearing - heading) % 360) + 540) % 360) - 180;
}

/** Horizontal camera field of view we assume, in degrees. */
export const FOV = 60;
/** How close to the middle of the screen the critter must be to catch it (fraction of half the width). */
export const CATCH_ZONE = 0.6;

/** Where the critter sits across the screen, from 0 (left edge) to 1 (right edge), or null when off screen. */
export function screenX(bearing: number, heading: number, fov = FOV): number | null {
  const d = angleDiff(bearing, heading);
  return Math.abs(d) > fov / 2 ? null : 0.5 + d / fov;
}
