'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { absolutePhotoUrl, attachPhotos, deleteHouse, reviewUrl } from '@/lib/housePhotos';
import { appUrl, notifyAdmin, sendEmail } from '@/lib/email';
import { submissionAdminEmail, submissionReceivedEmail } from '@/lib/emails';
import { geocodeAddress } from '@/lib/geocode';
import { displayName } from '@/lib/users';
import type { FormState } from '@/lib/forms';
import { contestToday, getSeason, openForSubmissions } from '@/lib/seasons';
import { fieldErrors, houseSchema } from '@/lib/validation';

export async function submitHouse(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser('/submit');
  const parsed = houseSchema.safeParse({ ...Object.fromEntries(fd), tags: fd.getAll('tags') });
  if (user.accountType !== 'HOST') return { errors: { form: 'Only hosts can enter a house. Become a host from your profile first.' } };
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const d = parsed.data;

  const season = getSeason(d.season);
  if (!season || !openForSubmissions(contestToday()).some((s) => s.key === season.key)) {
    return { errors: { season: 'That contest is closed to new entries. Pick another holiday.' } };
  }

  const house = await db.house.create({
    data: {
      ownerId: user.id,
      season: season.key,
      name: d.name,
      address: d.address,
      neighborhood: d.neighborhood || null,
      showExactAddress: d.showExactAddress,
      tags: d.tags,
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

/** A host deletes one of their own entries, with its photos. */
export async function deleteMyHouse(id: string) {
  const user = await requireUser('/profile');
  const house = await db.house.findFirst({ where: { id, ownerId: user.id }, select: { id: true } });
  if (!house) return;
  await deleteHouse(house.id);
  revalidatePath('/profile');
  revalidatePath('/');
  revalidatePath('/admin', 'layout');
}
