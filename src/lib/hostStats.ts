import { CONTEST_TIME_ZONE } from './seasons';
import { distanceM } from './visits';

type Visit = { userId: string; houseId: string; createdAt: Date; lat: number | null; lng: number | null };

/** Check-ins per hour of the evening (0 to 23, contest time zone). */
export function checkInsByHour(times: Date[], timeZone = CONTEST_TIME_ZONE): number[] {
  const hours = Array(24).fill(0) as number[];
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', hourCycle: 'h23' });
  for (const t of times) hours[Number(fmt.format(t)) % 24]++;
  return hours;
}

/** "7 pm", for an hour from checkInsByHour. */
export const hourLabel = (h: number) => (h === 0 ? '12 am' : h < 12 ? `${h} am` : h === 12 ? '12 pm' : `${h - 12} pm`);

/** How far a stop on a guest's night can be from the previous one and still count as the same outing. */
const SAME_OUTING_MS = 6 * 3600_000;
const METERS_PER_MILE = 1609.344;

/**
 * Miles guests traveled to reach this house: for each guest's visit here, the distance from the
 * house they checked in at just before, if that was on the same outing. Guests who came straight
 * here add nothing, since we never store where people start from.
 */
export function milesTraveledTo(houseId: string, visits: Visit[]): number {
  const byGuest = new Map<string, Visit[]>();
  for (const v of visits) byGuest.set(v.userId, [...(byGuest.get(v.userId) ?? []), v]);
  let meters = 0;
  for (const list of byGuest.values()) {
    list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    for (let i = 1; i < list.length; i++) {
      const [prev, here] = [list[i - 1], list[i]];
      if (here.houseId !== houseId || prev.houseId === houseId) continue;
      if (here.createdAt.getTime() - prev.createdAt.getTime() > SAME_OUTING_MS) continue;
      if (prev.lat === null || prev.lng === null || here.lat === null || here.lng === null) continue;
      meters += distanceM({ lat: prev.lat, lng: prev.lng }, { lat: here.lat, lng: here.lng });
    }
  }
  return Math.round((meters / METERS_PER_MILE) * 10) / 10;
}
