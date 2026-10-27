import 'server-only';

/**
 * Turns a street address into map coordinates with OpenStreetMap's Nominatim (free, no key).
 * Used only when a house has no photo location. Nominatim allows about one request a second
 * and asks for an identifying User-Agent, which is fine for one lookup per submission.
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const q = address.trim();
  if (!q) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Porchlight/1.0 (hello@porchlightcontest.com)', 'Accept-Language': 'en' },
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const [hit] = (await res.json()) as { lat: string; lon: string }[];
    if (!hit) return null;
    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  } catch (err) {
    console.warn('[geocode] lookup failed', err);
    return null;
  }
}
