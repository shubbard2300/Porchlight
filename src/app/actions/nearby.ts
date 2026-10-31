'use server';

import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { closestNearby, searchBox, usableFix } from '@/lib/nearby';
import { votingOpen } from '@/lib/checkIns';
import { CHECKIN_REPEAT_HOURS } from '@/lib/visits';
import { seasonCalendar } from '@/lib/seasonConfig';
import { forHoliday } from '@/lib/arDecor';

export type NearbyHouse = { id: string; name: string; photo: string | null; hasAr: boolean };

/**
 * Which contest house, if any, a signed-in visitor is standing in front of. Only the match goes back
 * (name and photo, never coordinates), and the visitor's position is not stored.
 *
 * Houses that hide their exact address are left out: answering "is there a house at this spot?" for
 * any point would let someone sweep a neighborhood and find them. Those visitors can still check in
 * on the house page or with the porch QR sign.
 */
export async function findNearbyHouse(lat: number, lng: number, accuracy: number | null): Promise<NearbyHouse | null> {
  const user = await currentUser();
  if (!user) return null;
  if (![lat, lng].every(Number.isFinite) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || !usableFix(accuracy)) return null;

  const me = { lat, lng };
  const houses = await db.house.findMany({
    where: { status: 'APPROVED', showExactAddress: true, ownerId: { not: user.id }, ...searchBox(me) },
    select: { id: true, name: true, season: true, lat: true, lng: true, photoUrls: true, arGreeting: true, arDecorations: { select: { kind: true } } },
    take: 20,
  });
  if (!houses.length) return null;

  // Someone who checked in here in the last few hours already knows they're here.
  const recent = await db.checkIn.findMany({
    where: { userId: user.id, houseId: { in: houses.map((h) => h.id) }, createdAt: { gte: new Date(Date.now() - CHECKIN_REPEAT_HOURS * 3600_000) } },
    select: { houseId: true },
  });
  const done = new Set(recent.map((c) => c.houseId));
  const open = new Map<string, boolean>();
  const candidates = [];
  for (const h of houses) {
    if (done.has(h.id)) continue;
    if (!open.has(h.season)) open.set(h.season, await votingOpen(h.season));
    if (open.get(h.season)) candidates.push(h);
  }

  const hit = closestNearby(candidates, me, accuracy);
  if (!hit) return null;
  const { getSeason } = await seasonCalendar();
  const hasAr = Boolean(hit.arGreeting) || forHoliday(hit.arDecorations, getSeason(hit.season)?.name).length > 0;
  return { id: hit.id, name: hit.name, photo: hit.photoUrls[0] ?? null, hasAr };
}
