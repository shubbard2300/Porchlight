import type { Icon3DName } from '@/components/Icon3D';
import { distanceM } from './visits';

/** How long a merchant QR scan doubles XP. Contest votes are never boosted (one person, one vote). */
export const BOOST_HOURS = 2;
/** A visitor's scans at the same merchant within this many hours count once. */
export const SCAN_REPEAT_HOURS = 12;
/** How far from a house a pitstop can be and still be suggested on its page. */
export const NEARBY_PITSTOP_M = 3000;

export const PITSTOP_CATEGORIES: { key: string; label: string; icon: Icon3DName }[] = [
  { key: 'cafe', label: 'Cafe', icon: 'fire' },
  { key: 'bakery', label: 'Bakery', icon: 'gift' },
  { key: 'treats', label: 'Ice cream & treats', icon: 'star' },
  { key: 'food-truck', label: 'Food truck', icon: 'party' },
  { key: 'restaurant', label: 'Restaurant', icon: 'house' },
  { key: 'shop', label: 'Shop', icon: 'money' },
];
export const getCategory = (key: string) => PITSTOP_CATEGORIES.find((c) => c.key === key) ?? PITSTOP_CATEGORIES[0];

export type Tier = 'BRONZE' | 'SILVER' | 'GOLD';
export const TIERS: Record<Tier, { label: string; color: string; radius: number; order: number }> = {
  GOLD: { label: 'Gold Pitstop', color: '#ffb000', radius: 17, order: 0 },
  SILVER: { label: 'Silver Pitstop', color: '#c9cbd6', radius: 15, order: 1 },
  BRONZE: { label: 'Bronze Pitstop', color: '#d98b4a', radius: 13, order: 2 },
};

/** XP after any active merchant boost. */
export function boostedXp(base: number, boostUntil: Date | null | undefined, now = new Date()): number {
  return boostUntil && boostUntil > now ? base * 2 : base;
}

export const boostActive = (until: Date | null | undefined, now = new Date()) => Boolean(until && until > now);

/** The closest pitstop to a point within `maxM`, best tier first when two are about as close. */
export function nearestPitstop<T extends { lat: number | null; lng: number | null; tier: Tier }>(
  at: { lat: number; lng: number }, pitstops: T[], maxM = NEARBY_PITSTOP_M,
): (T & { distanceM: number }) | null {
  const placed = pitstops.flatMap((p) => (p.lat === null || p.lng === null ? [] : [{ ...p, distanceM: distanceM(at, { lat: p.lat, lng: p.lng }) }]));
  // A gold sponsor up to 300 m further away still wins the slot.
  const score = (p: T & { distanceM: number }) => p.distanceM - (2 - TIERS[p.tier].order) * 150;
  return placed.filter((p) => p.distanceM <= maxM).sort((a, b) => score(a) - score(b))[0] ?? null;
}
