'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { absolutePhotoUrl, attachPhotos, deleteHouse, reviewUrl } from '@/lib/housePhotos';
import { appUrl, notifyAdmin, sendEmail } from '@/lib/email';
import { submissionAdminEmail, submissionReceivedEmail } from '@/lib/emails';
import { geocodeAddress } from '@/lib/geocode';
import { bracketsFor } from '@/lib/brackets';
import { displayName } from '@/lib/users';
import type { FormState } from '@/lib/forms';
import { contestToday, getSeason, openForSubmissions, phase } from '@/lib/seasons';
import { fieldErrors, houseEditSchema, houseSchema } from '@/lib/validation';

export async function submitHouse(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser('/submit');
  const parsed = houseSchema.safeParse({ ...Object.fromEntries(fd), tags: fd.getAll('tags') });
  if (user.accountType !== 'HOST') return { errors: { form: 'Only hosts can post a house. Become a host from your profile first.' } };
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const d = parsed.data;

  const season = getSeason(d.season);
  if (!season || !openForSubmissions(contestToday()).some((s) => s.key === season.key)) {
    return { errors: { season: 'That contest is closed to new submissions. Pick another holiday.' } };
  }
  if (!bracketsFor(season.name).some((b) => b.key === d.bracket)) return { errors: { bracket: 'Pick a bracket for this holiday.' } };

  const house = await db.house.create({
    data: {
      ownerId: user.id,
      season: season.key,
      name: d.name,
      address: d.address,
      neighborhood: d.neighborhood || null,
      showExactAddress: d.showExactAddress,
      tags: d.tags,
      bracket: d.bracket,
      litFrom: d.litFrom,
      litUntil: d.litUntil,
      description: d.description,
      contributionCents: d.contribution * 100,
    },
  });
  await attachPhotos(user.id, house.id, fd.getAll('photoIds').map(String));
  let placed = await db.house.findUniqueOrThrow({ where: { id: house.id }, select: { photoUrls: true, lat: true, lng: true } });
  if (placed.lat === null) {
    // No photo carried a location, so pin the house from its address.
    const spot = await geocodeAddress(house.address);
    if (spot) placed = await db.house.update({ where: { id: house.id }, data: spot, select: { photoUrls: true, lat: true, lng: true } });
  }

  await notifyAdmin(
    submissionAdminEmail({
      username: user.username,
      email: user.email,
      season: season.name,
      year: season.year,
      house: house.name,
      address: `${house.address}${house.neighborhood ? ` (${house.neighborhood})` : ''}`,
      showExactAddress: house.showExactAddress,
      lit: `${house.litFrom} to ${house.litUntil}`,
      tags: house.tags,
      pledge: d.contribution,
      photoUrls: placed.photoUrls.map((u) => absolutePhotoUrl(u)),
      mapPin: placed.lat !== null ? `https://www.google.com/maps?q=${placed.lat},${placed.lng}` : null,
      description: house.description,
      reviewUrl: reviewUrl(house),
    }),
    'submission',
    user.email,
  );
  await sendEmail({
    to: user.email,
    ...submissionReceivedEmail({ name: displayName(user), house: house.name, season: `${season.name} ${season.year}` }, appUrl),
    kind: 'submission-received',
  });

  redirect('/profile?submitted=1');
}

/**
 * A host edits a submission from their profile. A new address moves the pin and, on a live house,
 * sends it back to a quick review, so a house can't change places on the map without someone looking.
 */
export async function updateMyHouse(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser('/profile');
  const house = await db.house.findFirst({ where: { id, ownerId: user.id } });
  if (!house) return { errors: { form: 'That submission wasn’t found.' } };
  const parsed = houseEditSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const moved = d.address.trim().toLowerCase() !== house.address.trim().toLowerCase();
  const spot = moved ? await geocodeAddress(d.address) : null;
  const backToReview = moved && house.status === 'APPROVED';
  const saved = await db.house.update({
    where: { id: house.id },
    data: {
      name: d.name,
      address: d.address,
      neighborhood: d.neighborhood || null,
      showExactAddress: d.showExactAddress,
      litFrom: d.litFrom,
      litUntil: d.litUntil,
      description: d.description,
      ...(moved ? { lat: spot?.lat ?? null, lng: spot?.lng ?? null } : {}),
      ...(backToReview ? { status: 'PENDING' as const, reviewNote: null } : {}),
    },
  });

  if (moved) {
    const season = getSeason(saved.season);
    await notifyAdmin(
      submissionAdminEmail({
        username: user.username,
        email: user.email,
        season: season?.name ?? saved.season,
        year: season?.year ?? 0,
        house: `${saved.name} (new address)`,
        address: `${saved.address}${saved.neighborhood ? ` (${saved.neighborhood})` : ''}, was ${house.address}`,
        showExactAddress: saved.showExactAddress,
        lit: `${saved.litFrom} to ${saved.litUntil}`,
        tags: saved.tags,
        pledge: saved.contributionCents / 100,
        photoUrls: saved.photoUrls.map((u) => absolutePhotoUrl(u)),
        mapPin: saved.lat !== null ? `https://www.google.com/maps?q=${saved.lat},${saved.lng}` : null,
        description: saved.description,
        reviewUrl: reviewUrl(saved),
      }),
      'submission',
      user.email,
    );
  }

  revalidatePath('/profile');
  revalidatePath('/');
  revalidatePath(`/house/${house.id}`);
  if (backToReview) return { message: 'Saved. Your new address is in a quick review, and your house is back on the map once it’s approved.' };
  if (moved && !spot) return { message: 'Saved. We couldn’t place that address on the map yet, so double-check it or add a photo taken at the house.' };
  return { message: 'Submission details saved.' };
}

/** A host removes one of their own submissions, with its photos. */
export async function deleteMyHouse(id: string) {
  const user = await requireUser('/profile');
  const house = await db.house.findFirst({ where: { id, ownerId: user.id }, select: { id: true } });
  if (!house) return;
  await deleteHouse(house.id);
  revalidatePath('/profile');
  revalidatePath('/');
  revalidatePath('/admin', 'layout');
}

/** A host moves one of their submissions to another bracket while its contest is still running. */
export async function setHouseBracket(id: string, bracket: string): Promise<{ error?: string }> {
  const user = await requireUser('/profile');
  const house = await db.house.findFirst({ where: { id, ownerId: user.id }, select: { id: true, season: true } });
  const season = house && getSeason(house.season);
  if (!house || !season) return { error: 'That submission wasn’t found.' };
  const p = phase(season, contestToday());
  if (p !== 'soon' && p !== 'live') return { error: 'This contest has ended, so its brackets are locked.' };
  if (!bracketsFor(season.name).some((b) => b.key === bracket)) return { error: 'Pick a bracket for this holiday.' };
  await db.house.update({ where: { id: house.id }, data: { bracket } });
  revalidatePath('/profile');
  revalidatePath('/');
  revalidatePath('/leaderboard');
  revalidatePath(`/house/${house.id}`);
  return {};
}
