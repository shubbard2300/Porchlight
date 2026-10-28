import { distanceM } from './visits';

/**
 * The Route Weaver: picks a loop of houses that fits the time a visitor has, starting and ending
 * where they are. It's a quick greedy plan (best value per added minute) tidied up with 2-opt,
 * then handed to Google or Apple Maps for the actual turn-by-turn directions.
 */

export type TravelMode = 'driving' | 'walking';

export const MODES: Record<TravelMode, { label: string; kmh: number; dwellMin: number }> = {
  // Neighborhood driving with stop signs and slow cruising past the lights.
  driving: { label: 'Driving', kmh: 22, dwellMin: 6 },
  walking: { label: 'Walking', kmh: 4.5, dwellMin: 5 },
};
/** Streets are never straight lines: stretch crow-flies distance by this much. */
export const DETOUR = 1.35;
export const TIME_CHOICES = [30, 60, 90, 120] as const;
/** Google Maps direction links take at most this many stops between the start and the end. */
export const MAX_STOPS = 9;

export type Point = { lat: number; lng: number };
export type Candidate = Point & { id: string; value: number };
export type Leg<T> = T & { arriveMin: number; legKm: number };

export function travelMin(a: Point, b: Point, mode: TravelMode): number {
  return ((distanceM(a, b) * DETOUR) / 1000 / MODES[mode].kmh) * 60;
}

/** How much a house is worth a detour: crowd favorites first, but every lit porch counts. */
export function houseValue(h: { likes: number; avgScore: number | null }): number {
  return 1 + h.likes + (h.avgScore ?? 5) / 2;
}

function loopMin(start: Point, stops: Point[], mode: TravelMode): number {
  let t = 0;
  let at = start;
  for (const s of stops) { t += travelMin(at, s, mode) + MODES[mode].dwellMin; at = s; }
  return t + (stops.length ? travelMin(at, start, mode) : 0);
}

/** Reverses stretches of the loop while that shortens it. */
function twoOpt<T extends Point>(start: Point, stops: T[], mode: TravelMode): T[] {
  let best = stops;
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const next = [...best.slice(0, i), ...best.slice(i, j + 1).reverse(), ...best.slice(j + 1)];
        if (loopMin(start, next, mode) < loopMin(start, best, mode) - 0.01) { best = next; improved = true; }
      }
    }
  }
  return best;
}

export type Plan<T> = { stops: Leg<T>[]; totalMin: number; totalKm: number };

export function planRoute<T extends Candidate>(start: Point, candidates: T[], minutes: number, mode: TravelMode, maxStops = MAX_STOPS): Plan<T> {
  const left = [...candidates];
  let chosen: T[] = [];
  while (chosen.length < maxStops && left.length) {
    const base = loopMin(start, chosen, mode);
    let pick: { i: number; score: number; stops: T[] } | null = null;
    for (const [i, c] of left.entries()) {
      // Try the house at every position in the loop and keep the cheapest.
      for (let at = 0; at <= chosen.length; at++) {
        const stops = [...chosen.slice(0, at), c, ...chosen.slice(at)];
        const total = loopMin(start, stops, mode);
        if (total > minutes) continue;
        const score = c.value / Math.max(total - base, 1);
        if (!pick || score > pick.score) pick = { i, score, stops };
      }
    }
    if (!pick) break;
    const { i, stops } = pick;
    chosen = twoOpt(start, stops, mode);
    left.splice(i, 1);
  }
  return withLegs(start, chosen, mode);
}

export function withLegs<T extends Point>(start: Point, stops: T[], mode: TravelMode): Plan<T> {
  let at: Point = start;
  let t = 0;
  let km = 0;
  const legs = stops.map((s) => {
    const legKm = (distanceM(at, s) * DETOUR) / 1000;
    t += travelMin(at, s, mode);
    km += legKm;
    const leg = { ...s, arriveMin: Math.round(t), legKm };
    t += MODES[mode].dwellMin;
    at = s;
    return leg;
  });
  if (stops.length) { t += travelMin(at, start, mode); km += (distanceM(at, start) * DETOUR) / 1000; }
  return { stops: legs, totalMin: Math.round(t), totalKm: km };
}

/** Slots a pitstop into the loop where it adds the least time, if it still fits. */
export function addPitstop<T extends Point, P extends Point>(start: Point, stops: T[], pitstops: P[], minutes: number, mode: TravelMode, maxStops = MAX_STOPS): { stops: (T | P)[]; pitstop: P | null } {
  if (!stops.length || stops.length >= maxStops) return { stops, pitstop: null };
  let best: { stops: (T | P)[]; total: number; p: P } | null = null;
  for (const p of pitstops) {
    for (let at = 0; at <= stops.length; at++) {
      const next = [...stops.slice(0, at), p, ...stops.slice(at)];
      const total = loopMin(start, next, mode);
      if (total <= minutes && (!best || total < best.total)) best = { stops: next, total, p };
    }
  }
  return best ? { stops: best.stops, pitstop: best.p } : { stops, pitstop: null };
}

const ll = (p: Point) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;

/** A Google Maps directions link for the whole loop, back to the start. */
export function googleRouteUrl(start: Point, stops: Point[], mode: TravelMode): string {
  const q = new URLSearchParams({ api: '1', origin: ll(start), destination: ll(start), travelmode: mode });
  if (stops.length) q.set('waypoints', stops.map(ll).join('|'));
  return `https://www.google.com/maps/dir/?${q.toString()}`;
}

/** Apple Maps directions to one stop. Apple's links don't take waypoints, so each stop gets its own. */
export function appleStopUrl(from: Point, to: Point, mode: TravelMode): string {
  return `https://maps.apple.com/?saddr=${ll(from)}&daddr=${ll(to)}&dirflg=${mode === 'walking' ? 'w' : 'd'}`;
}
