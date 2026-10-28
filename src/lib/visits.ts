/** How close (in meters) a visitor's phone must be to a house to check in by location. */
export const GEOFENCE_M = 150;
/** Phone GPS is fuzzy, so up to this much of its reported accuracy is added to the radius. */
export const MAX_ACCURACY_ALLOWANCE_M = 50;
/** A second check-in at the same house within this many hours reuses the first one. */
export const CHECKIN_REPEAT_HOURS = 3;

export const SCORE_CATEGORIES = [
  { key: 'creativity', label: 'Creativity', hint: 'Original ideas, clever touches' },
  { key: 'lighting', label: 'Lighting', hint: 'Glow, color, sparkle' },
  { key: 'storytelling', label: 'Storytelling', hint: 'A theme that pulls you in' },
  { key: 'sound', label: 'Sound design', hint: 'Music, effects, atmosphere' },
] as const;
export type ScoreKey = (typeof SCORE_CATEGORIES)[number]['key'];
export const SCORE_MIN = 1;
export const SCORE_MAX = 10;

/** Great-circle distance in meters between two points. */
export function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6_371_000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function insideGeofence(distance: number, accuracy?: number | null): boolean {
  const slack = Math.min(Math.max(accuracy ?? 0, 0), MAX_ACCURACY_ALLOWANCE_M);
  return distance <= GEOFENCE_M + slack;
}

/** "320 m" or "1.4 km", for telling a visitor how far they still are. */
export function formatDistance(m: number): string {
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`;
}

/** Average of whichever scorecard values are present, to one decimal, or null when there are none. */
export function averageScore(v: Partial<Record<ScoreKey, number | null>>): number | null {
  const xs = SCORE_CATEGORIES.map((c) => v[c.key]).filter((x): x is number => typeof x === 'number');
  return xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null;
}

/**
 * Comments are meant to be cheers for the host. This catches the obvious put-downs;
 * anything subtler is for admins to take down.
 */
const UNKIND = [
  'ugly', 'trash', 'garbage', 'hate', 'hideous', 'lame', 'boring', 'tacky', 'cheap', 'worst', 'awful', 'terrible',
  'sucks', 'stupid', 'dumb', 'idiot', 'pathetic', 'disgusting', 'gross', 'eyesore', 'loser', 'crap', 'shit', 'fuck',
];
export function isKind(comment: string): boolean {
  const words = comment.toLowerCase().match(/[a-z]+/g) ?? [];
  return !words.some((w) => UNKIND.includes(w));
}
