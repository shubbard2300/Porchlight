import { distanceM } from './visits';

/** Radius choices for "new house near me" alerts, in km. */
export const ALERT_RADII = [1, 3, 5, 10] as const;
/** A host hears about likes at most this often per house. */
export const LIKE_ALERT_MINUTES = 30;

export type Alert = { title: string; body: string; url: string; tag?: string };

export const ALERT_KINDS = [
  { key: 'alertNearby', label: 'New houses near me', hint: 'When a house within your radius goes live.' },
  { key: 'alertHost', label: 'Likes on my house', hint: 'For hosts. At most one alert every half hour.' },
  { key: 'alertSquad', label: 'My caravan', hint: 'When a squadmate checks in somewhere.' },
  { key: 'alertLastCall', label: 'Last call to vote', hint: 'On the evening of the holiday, before voting closes.' },
] as const;
export type AlertKind = (typeof ALERT_KINDS)[number]['key'];

/** Whether a new house is close enough to someone's saved spot to tell them about it. */
export function isNearby(spot: { alertLat: number | null; alertLng: number | null; alertRadiusKm: number }, house: { lat: number | null; lng: number | null }) {
  if (spot.alertLat === null || spot.alertLng === null || house.lat === null || house.lng === null) return false;
  return distanceM({ lat: spot.alertLat, lng: spot.alertLng }, { lat: house.lat, lng: house.lng }) <= spot.alertRadiusKm * 1000;
}

/** Whether enough time has passed since the host's last like alert. */
export const likeAlertDue = (last: Date | null, now = new Date()) => !last || now.getTime() - last.getTime() >= LIKE_ALERT_MINUTES * 60_000;

/** Snaps a typed radius to the closest allowed one. */
export function clampRadius(km: number): number {
  return ALERT_RADII.reduce((best, r) => (Math.abs(r - km) < Math.abs(best - km) ? r : best), ALERT_RADII[1]);
}
