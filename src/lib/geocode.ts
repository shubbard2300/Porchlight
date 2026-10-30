import 'server-only';
import { usState } from './legal';

/**
 * Turns a street address into map coordinates with OpenStreetMap's Nominatim (free, no key).
 * Used only when a house has no photo location. Nominatim allows about one request a second
 * and asks for an identifying User-Agent, which is fine for one lookup per submission.
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const hit = await lookupAddress(address);
  return hit && { lat: hit.lat, lng: hit.lng };
}

/** Like geocodeAddress, plus the two-letter US state the address is in (null outside the US or if unknown) and its neighborhood. */
export async function lookupAddress(address: string): Promise<{ lat: number; lng: number; state: string | null; neighborhood: string | null } | null> {
  const q = address.trim();
  if (!q) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Porchlight/1.0 (hello@porchlightcontest.com)', 'Accept-Language': 'en' },
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const [hit] = (await res.json()) as { lat: string; lon: string; address?: Record<string, string> }[];
    if (!hit) return null;
    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    const neighborhood = hit.address?.neighbourhood ?? hit.address?.suburb ?? null;
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng, state: usState(hit.address), neighborhood } : null;
  } catch (err) {
    console.warn('[geocode] lookup failed', err);
    return null;
  }
}

type NominatimAddress = {
  house_number?: string; road?: string; neighbourhood?: string; suburb?: string;
  city?: string; town?: string; village?: string; hamlet?: string; county?: string;
  state?: string; postcode?: string; 'ISO3166-2-lvl4'?: string;
};

/** "1820 SE Alder Ct, Portland, OR 97214" from Nominatim's address parts. Exported for tests. */
export function formatAddress(a: NominatimAddress) {
  const street = [a.house_number, a.road].filter(Boolean).join(' ');
  const town = a.city ?? a.town ?? a.village ?? a.hamlet ?? a.county;
  const iso = a['ISO3166-2-lvl4'];
  const state = iso?.startsWith('US-') ? iso.slice(3) : a.state;
  const region = [state, a.postcode].filter(Boolean).join(' ');
  return {
    address: [street, town, region].filter(Boolean).join(', '),
    neighborhood: a.neighbourhood ?? a.suburb ?? null,
    hasStreet: Boolean(street),
  };
}

/** The street address at a point, for suggesting where a house is. Null if the lookup fails. */
export async function reverseGeocode(lat: number, lng: number) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Porchlight/1.0 (hello@porchlightcontest.com)', 'Accept-Language': 'en' },
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const hit = (await res.json()) as { address?: NominatimAddress };
    return hit.address ? formatAddress(hit.address) : null;
  } catch (err) {
    console.warn('[geocode] reverse lookup failed', err);
    return null;
  }
}
