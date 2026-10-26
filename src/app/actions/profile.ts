'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import type { FormState } from '@/lib/forms';
import { getSeason } from '@/lib/seasons';
import { fieldErrors, hostProfileSchema, profileSchema } from '@/lib/validation';

const MAX_AVATAR_BYTES = 1_000_000;

export async function saveProfile(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser('/profile');
  const parsed = profileSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  await db.user.update({
    where: { id: user.id },
    data: { displayName: d.displayName || null, hometown: d.hometown || null, bio: d.bio || null, marketingOptIn: d.marketingOptIn },
  });
  revalidatePath('/', 'layout');
  return { message: 'Profile saved.' };
}

export async function saveHostProfile(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser('/profile');
  if (user.accountType !== 'HOST') return { errors: { form: 'Switch to a host account first.' } };
  const parsed = hostProfileSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  if (d.hostSeason && !getSeason(d.hostSeason)) return { errors: { hostSeason: 'Pick a holiday from the list.' } };
  await db.user.update({
    where: { id: user.id },
    data: {
      propertyAddress: d.propertyAddress || null,
      neighborhood: d.neighborhood || null,
      hostSeason: d.hostSeason || null,
      decorationTheme: d.decorationTheme || null,
      propertyDetails: d.propertyDetails || null,
    },
  });
  revalidatePath('/profile');
  return { message: 'Property details saved.' };
}

/** Accepts JPEG, PNG or WebP, checked by file signature rather than the browser's claimed type. */
function sniffImage(b: Buffer): string | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
}

export async function uploadAvatar(fd: FormData): Promise<{ error?: string }> {
  const user = await requireUser('/profile');
  const file = fd.get('avatar');
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose a photo to upload.' };
  if (file.size > MAX_AVATAR_BYTES) return { error: 'That photo is too large. Try one under 1 MB.' };
  const data = Buffer.from(await file.arrayBuffer());
  const contentType = sniffImage(data);
  if (!contentType) return { error: 'Use a JPEG, PNG or WebP photo.' };
  await db.avatar.upsert({ where: { userId: user.id }, update: { data, contentType }, create: { userId: user.id, data, contentType } });
  await db.user.update({ where: { id: user.id }, data: { avatarUpdatedAt: new Date() } });
  revalidatePath('/', 'layout');
  return {};
}

export async function removeAvatar() {
  const user = await requireUser('/profile');
  await db.avatar.deleteMany({ where: { userId: user.id } });
  await db.user.update({ where: { id: user.id }, data: { avatarUpdatedAt: null } });
  revalidatePath('/', 'layout');
}

export async function becomeHost() {
  const user = await requireUser('/profile');
  await db.user.update({ where: { id: user.id }, data: { accountType: 'HOST' } });
  redirect('/profile?host=1#property');
}
