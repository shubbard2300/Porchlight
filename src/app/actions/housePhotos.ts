'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { notifyAdmin } from '@/lib/email';
import { newPhotoAdminEmail } from '@/lib/emails';
import { absolutePhotoUrl, PENDING_PHOTO_MS, photoSelect, reviewUrl, savePhoto, syncHousePhotos } from '@/lib/housePhotos';
import { deletePhotoFiles } from '@/lib/photoStorage';
import { photoLocationSchema, photoMetaSchema } from '@/lib/validation';

export type HousePhotoView = { id: string; url: string; lat: number | null; lng: number | null; locationSource: string | null };
type Result = { photo?: HousePhotoView; error?: string };

/** Photos added to one entry within this window share a single admin email. */
const NOTIFY_QUIET_MS = 10 * 60 * 1000;

function refresh() {
  revalidatePath('/profile');
  revalidatePath('/');
}

/** Removes submit-form uploads that never became part of an entry. */
async function sweepAbandoned(ownerId: string) {
  const stale = await db.housePhoto.findMany({ where: { ownerId, houseId: null, createdAt: { lt: new Date(Date.now() - PENDING_PHOTO_MS) } }, select: { id: true, blobUrl: true } });
  if (stale.length === 0) return;
  await db.housePhoto.deleteMany({ where: { id: { in: stale.map((p) => p.id) } } });
  await deletePhotoFiles(stale.map((p) => p.blobUrl));
}

/** Tells the admin inbox a photo was added to an existing entry, with a link to review it. */
async function notifyNewPhoto(houseId: string, photoId: string, user: { username: string; email: string }) {
  const recent = await db.housePhoto.count({ where: { houseId, id: { not: photoId }, createdAt: { gt: new Date(Date.now() - NOTIFY_QUIET_MS) } } });
  if (recent > 0) return;
  const house = await db.house.findUniqueOrThrow({ where: { id: houseId }, select: { id: true, name: true, status: true, photoUrls: true } });
  const live = house.status === 'APPROVED';
  await notifyAdmin(
    newPhotoAdminEmail({ username: user.username, email: user.email, house: house.name, live, photoUrls: house.photoUrls.map((u) => absolutePhotoUrl(u)), reviewUrl: reviewUrl(house) }),
    'submission',
    user.email,
  );
}

export async function uploadHousePhoto(fd: FormData): Promise<Result> {
  const user = await requireUser('/profile');
  if (user.accountType !== 'HOST') return { error: 'Only hosts can add house photos.' };
  const file = fd.get('photo');
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose a photo to upload.' };
  const parsed = photoMetaSchema.safeParse(Object.fromEntries([...fd].filter(([k]) => k !== 'photo')));
  if (!parsed.success) return { error: 'We could not read that photo’s details. Try again.' };
  const { houseId, ...m } = parsed.data;

  if (houseId) {
    const house = await db.house.findFirst({ where: { id: houseId, ownerId: user.id }, select: { id: true } });
    if (!house) return { error: 'That submission was not found.' };
  } else {
    await sweepAbandoned(user.id);
  }
  const { photo, error } = await savePhoto(user.id, file, m, houseId ?? null);
  if (!photo) return { error };
  if (houseId) {
    await syncHousePhotos(houseId);
    await notifyNewPhoto(houseId, photo.id, user);
    refresh();
  }
  return { photo };
}

/** Adds the browser's current position to a photo that had none in its GPS tags. */
export async function setHousePhotoLocation(id: string, lat: number, lng: number): Promise<Result> {
  const user = await requireUser('/profile');
  const parsed = photoLocationSchema.safeParse({ lat, lng });
  if (!parsed.success) return { error: 'That location is not valid.' };
  const found = await db.housePhoto.findFirst({ where: { id, ownerId: user.id }, select: { houseId: true } });
  if (!found) return { error: 'That photo was not found.' };
  const photo = await db.housePhoto.update({ where: { id }, data: { ...parsed.data, locationSource: 'device' }, select: photoSelect });
  if (found.houseId) {
    await syncHousePhotos(found.houseId);
    refresh();
  }
  return { photo };
}

export async function removeHousePhoto(id: string): Promise<Result> {
  const user = await requireUser('/profile');
  const photo = await db.housePhoto.findFirst({ where: { id, ownerId: user.id }, select: { blobUrl: true, houseId: true } });
  if (!photo) return {};
  await db.housePhoto.delete({ where: { id } });
  await deletePhotoFiles([photo.blobUrl]);
  if (photo.houseId) {
    const rest = await db.housePhoto.findMany({ where: { houseId: photo.houseId }, orderBy: [{ position: 'asc' }, { createdAt: 'asc' }], select: { id: true } });
    await db.$transaction(rest.map((p, position) => db.housePhoto.update({ where: { id: p.id }, data: { position } })));
    await syncHousePhotos(photo.houseId);
    refresh();
  }
  return {};
}

/** Moves a photo to the front of its entry, making it the cover on the house card. */
export async function makeCoverPhoto(id: string): Promise<Result> {
  const user = await requireUser('/profile');
  const photo = await db.housePhoto.findFirst({ where: { id, ownerId: user.id }, select: { houseId: true } });
  if (!photo?.houseId) return {};
  const all = await db.housePhoto.findMany({ where: { houseId: photo.houseId }, orderBy: [{ position: 'asc' }, { createdAt: 'asc' }], select: { id: true } });
  const ordered = [id, ...all.map((p) => p.id).filter((p) => p !== id)];
  await db.$transaction(ordered.map((pid, position) => db.housePhoto.update({ where: { id: pid }, data: { position } })));
  await syncHousePhotos(photo.houseId);
  refresh();
  return {};
}
