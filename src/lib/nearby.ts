import { distanceM } from './visits';

/**
 * "You're at a house" prompt. The ask was about 20 ft (6 m), but phone GPS outdoors is usually
 * good to 5 to 15 m and a house pin sits in the middle of the lot, so someone on the sidewalk out
 * front is often 15 to 25 m from it. We aim for "standing out front": the pin within 25 m, plus a
 * little of the phone's reported accuracy, and readings that are too fuzzy are ignored.
 */
export const NEARBY_M = 25;
/** Up to this much of the phone's reported accuracy is added to the radius. */
export const NEARBY_ACCURACY_ALLOWANCE_M = 10;
/** Readings worse than this (wifi or cell tower fixes) never trigger a prompt. */
export const NEARBY_MAX_ACCURACY_M = 40;
/** After "Dismiss", the same house stays quiet for this long on this device. */
export const NEARBY_SNOOZE_HOURS = 6;
/** The browser asks the server at most this often, and only after moving a little. */
export const NEARBY_POLL_MS = 15_000;
export const NEARBY_MOVE_M = 8;

export type LatLng = { lat: number; lng: number };

export function usableFix(accuracy: number | null | undefined): boolean {
  return typeof accuracy === 'number' && Number.isFinite(accuracy) && accuracy <= NEARBY_MAX_ACCURACY_M;
}

export function nearbyRadius(accuracy: number | null | undefined): number {
  return NEARBY_M + Math.min(Math.max(accuracy ?? 0, 0), NEARBY_ACCURACY_ALLOWANCE_M);
}

/** The closest house close enough to count as "out front", or null. Houses without a pin are skipped. */
export function closestNearby<T extends { lat: number | null; lng: number | null }>(houses: T[], me: LatLng, accuracy: number | null | undefined): (T & { distanceM: number }) | null {
  if (!usableFix(accuracy)) return null;
  const r = nearbyRadius(accuracy);
  let best: (T & { distanceM: number }) | null = null;
  for (const h of houses) {
    if (h.lat === null || h.lng === null) continue;
    const d = distanceM(me, { lat: h.lat, lng: h.lng });
    if (d <= r && (!best || d < best.distanceM)) best = { ...h, distanceM: d };
  }
  return best;
}

/** A small box around a point for the database query (about ±60 m), before the exact distance check. */
export function searchBox(me: LatLng) {
  const dLat = 0.00055;
  const dLng = dLat / Math.max(Math.cos((me.lat * Math.PI) / 180), 0.2);
  return { lat: { gte: me.lat - dLat, lte: me.lat + dLat }, lng: { gte: me.lng - dLng, lte: me.lng + dLng } };
}

/** Whether a dismissed house is still snoozed. */
export function snoozed(dismissedAt: number | undefined, now: number): boolean {
  return typeof dismissedAt === 'number' && now - dismissedAt < NEARBY_SNOOZE_HOURS * 3600_000;
}
