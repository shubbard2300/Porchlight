'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import type { FormState } from '@/lib/forms';
import { getSeason } from '@/lib/seasons';
import { sniffImage } from '@/lib/images';
import bcrypt from 'bcryptjs';
import { fieldErrors, hostProfileSchema, newPasswordSchema, profileSchema } from '@/lib/validation';

const MAX_AVATAR_BYTES = 1_000_000;

export async function saveProfile(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser('/profile');
  const parsed = profileSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  if (d.username !== user.username) {
    const taken = await db.user.findUnique({ where: { username: d.username }, select: { id: true } });
    if (taken) return { errors: { username: 'That username is taken. Try another.' } };
  }
  try {
    await db.user.update({
      where: { id: user.id },
      data: { username: d.username, displayName: d.displayName || null, hometown: d.hometown || null, bio: d.bio || null, marketingOptIn: d.marketingOptIn },
    });
  } catch (err) {
    // Someone claimed the name between the check and the save.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') return { errors: { username: 'That username is taken. Try another.' } };
    throw err;
  }
  revalidatePath('/', 'layout');
  return { message: 'Profile saved.' };
}

export async function setPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser('/profile');
  const parsed = newPasswordSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(parsed.data.password, 12) } });
  return { message: user.passwordHash ? 'Password changed.' : 'Password set. You can now log in with it.' };
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
