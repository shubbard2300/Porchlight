'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { VOTE_XP } from '@/lib/rewards';
import { boostedXp } from '@/lib/pitstops';
import { fieldErrors, voteSchema } from '@/lib/validation';
import type { FormState } from '@/lib/forms';
import { distanceM, formatDistance, insideGeofence } from '@/lib/visits';
import { recordCheckIn, votableHouse } from '@/lib/checkIns';

export type CheckInResult = { ok: true } | { ok: false; message: string };

/** Checks a visitor in from their phone's location. The house's real position never leaves the server. */
export async function checkInByLocation(houseId: string, lat: number, lng: number, accuracy: number | null): Promise<CheckInResult> {
  const user = await currentUser();
  if (!user) return { ok: false, message: 'Log in to check in.' };
  if (![lat, lng].every(Number.isFinite) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return { ok: false, message: 'Your phone didn’t send a usable location. Try again.' };
  const found = await votableHouse(houseId, user.id);
  if ('error' in found) return { ok: false, message: found.error };
  const { house } = found;
  if (house.lat === null || house.lng === null) return { ok: false, message: 'This house has no map pin yet, so scan the QR sign on the porch instead.' };

  const d = distanceM({ lat, lng }, { lat: house.lat, lng: house.lng });
  if (!insideGeofence(d, accuracy)) {
    // Only say how far for houses that show their address; for hidden ones a distance would help someone triangulate it.
    return {
      ok: false,
      message: house.showExactAddress
        ? `You’re about ${formatDistance(d)} away. Get within 150 m of the house, or scan the QR sign on the porch.`
        : 'You’re not close enough yet. Head to the house, or scan the QR sign on the porch.',
    };
  }
  await recordCheckIn(user.id, house.id, 'GEO', Math.round(d));
  revalidatePath(`/house/${house.id}`);
  return { ok: true };
}

/** Saves (or updates) a visitor's scorecard. Needs a check-in at the house first. */
export async function castVote(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await currentUser();
  if (!user) return { errors: { form: 'Log in to vote.' } };
  const parsed = voteSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const d = parsed.data;

  const found = await votableHouse(d.houseId, user.id);
  if ('error' in found) return { errors: { form: found.error } };
  const checkIn = await db.checkIn.findFirst({ where: { userId: user.id, houseId: d.houseId }, orderBy: { createdAt: 'asc' } });
  if (!checkIn) return { errors: { form: 'Check in at the house first, by location or the porch QR sign.' } };

  const xp = boostedXp(VOTE_XP, user.xpBoostUntil);
  const scores = { creativity: d.creativity, lighting: d.lighting, storytelling: d.storytelling, sound: d.sound };
  const existing = await db.vote.findUnique({ where: { userId_houseId: { userId: user.id, houseId: d.houseId } }, select: { id: true } });
  await db.$transaction([
    db.vote.upsert({
      where: { userId_houseId: { userId: user.id, houseId: d.houseId } },
      create: { userId: user.id, houseId: d.houseId, liked: d.liked, verifiedAt: checkIn.createdAt, comment: d.comment || null, ...scores },
      update: { liked: d.liked, verifiedAt: checkIn.createdAt, comment: d.comment || null, ...scores },
    }),
    ...(existing ? [] : [db.user.update({ where: { id: user.id }, data: { xp: { increment: xp } } })]),
  ]);
  revalidatePath(`/house/${d.houseId}`);
  revalidatePath('/');
  return { message: existing ? 'Scorecard updated.' : `Scorecard saved. +${xp} XP${xp > VOTE_XP ? ' (pitstop boost!)' : ''}` };
}
