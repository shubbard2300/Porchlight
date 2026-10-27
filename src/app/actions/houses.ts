'use server';

import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { absolutePhotoUrl, attachPhotos, reviewUrl } from '@/lib/housePhotos';
import { appUrl, notifyAdmin, sendEmail } from '@/lib/email';
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
    `New ${season.name} submission: ${house.name}`,
    [
      `${user.username} <${user.email}> posted a house for ${season.name} ${season.year}.`,
      '',
      `Name: ${house.name}`,
      `Address: ${house.address}${house.neighborhood ? ` (${house.neighborhood})` : ''}`,
      `Show exact address: ${house.showExactAddress ? 'yes' : 'no'}`,
      `Lit: ${house.litFrom} to ${house.litUntil}`,
      `Features: ${house.tags.join(', ') || 'none listed'}`,
      `Pot pledge: $${d.contribution}`,
      `Photos: ${placed.photoUrls.length}`,
      ...placed.photoUrls.map((u) => `  ${absolutePhotoUrl(u)}`),
      `Map pin: ${placed.lat !== null ? `https://www.google.com/maps?q=${placed.lat},${placed.lng}` : 'none yet'}`,
      '',
      house.description,
      '',
      `Approve or reject it: ${reviewUrl(house)}`,
    ].join('\n'),
    'submission',
    user.email,
  );
  await sendEmail({
    to: user.email,
    subject: `We got ${house.name}`,
    text: [
      `Hi ${displayName(user)},`,
      '',
      `Thanks for posting ${house.name} for ${season.name} ${season.year}. We review new houses quickly, and you'll get an email once it's live on the map.`,
      '',
      `See your entries: ${appUrl('/profile')}`,
    ].join('\n'),
    kind: 'submission-received',
  });

  redirect('/profile?submitted=1');
}
