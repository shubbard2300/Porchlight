/**
 * Public map positions. Houses that hide their exact address get a pin snapped to a ~1 km grid
 * and nudged by a fixed amount derived from the house id, so the real spot never reaches the browser
 * and neighbors with hidden addresses don't stack on one point.
 */
const GRID = 0.01;
const NUDGE = 0.003;

function hash(s: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000; // 0..1
}

export function publicPin(h: { id: string; lat: number; lng: number; showExactAddress: boolean }): { lat: number; lng: number } {
  if (h.showExactAddress) return { lat: h.lat, lng: h.lng };
  const snap = (v: number) => Math.round(v / GRID) * GRID;
  return {
    lat: Number((snap(h.lat) + (hash(h.id, 1) * 2 - 1) * NUDGE).toFixed(4)),
    lng: Number((snap(h.lng) + (hash(h.id, 2) * 2 - 1) * NUDGE).toFixed(4)),
  };
}

/**
 * Exact addresses are for signed-in members only: logged-out visitors and search engines always get the
 * neighborhood and the approximate pin, even when the host chose to show their address.
 */
export function forViewer<T extends { showExactAddress: boolean }>(h: T, signedIn: boolean): T {
  return h.showExactAddress && !signedIn ? { ...h, showExactAddress: false } : h;
}
