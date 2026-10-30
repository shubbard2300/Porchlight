'use server';

import { headers } from 'next/headers';
import { reverseGeocode } from '@/lib/geocode';
import { photoLocationSchema } from '@/lib/validation';

export type AddressGuess = {
  address: string;
  neighborhood: string | null;
  /** "photo" or "device" is a street address at that spot; "ip" is only the town the connection comes from. */
  source: 'photo' | 'device' | 'ip';
};

/**
 * Suggests the host's address for them to confirm: from a photo's GPS or the phone's location when there is one,
 * otherwise the town from Vercel's IP location headers. Nothing here is saved; the host confirms or types it.
 */
export async function suggestAddress(where: { lat: number; lng: number; source: 'photo' | 'device' } | null): Promise<AddressGuess | null> {
  const point = where && photoLocationSchema.safeParse(where).success ? where : null;
  if (point) {
    const hit = await reverseGeocode(point.lat, point.lng);
    if (hit?.address) return { address: hit.address, neighborhood: hit.neighborhood, source: point.source };
  }
  const h = await headers();
  const city = h.get('x-vercel-ip-city');
  if (!city) return null;
  const region = h.get('x-vercel-ip-country-region');
  return { address: [decodeURIComponent(city), region].filter(Boolean).join(', '), neighborhood: null, source: 'ip' };
}
