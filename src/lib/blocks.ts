import { distanceM } from './visits';

export const DEFAULT_BLOCK_RADIUS_M = 400;

type Spot = { lat: number; lng: number };
type Zone = Spot & { radiusM: number };

/** Whether a public pin falls inside a block. Hidden-address houses are matched by their fuzzed pin, never their real spot. */
export const inBlock = (block: Zone, pin: Spot) => distanceM(block, pin) <= block.radiusM;

/** A circle as a GeoJSON ring, since map circles are sized in pixels, not meters. */
export function circleRing({ lat, lng, radiusM }: Zone, steps = 64): [number, number][] {
  const dLat = radiusM / 111_320;
  const dLng = radiusM / (111_320 * Math.cos((lat * Math.PI) / 180));
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = (i / steps) * 2 * Math.PI;
    return [Number((lng + dLng * Math.cos(a)).toFixed(6)), Number((lat + dLat * Math.sin(a)).toFixed(6))];
  });
}
