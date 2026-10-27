'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { notifyAdmin } from '@/lib/email';
import { absolutePhotoUrl, photoSelect, reviewUrl, syncHousePhotos } from '@/lib/housePhotos';
import { sniffImage } from '@/lib/images';
import { deletePhotoFiles, storePhotoFile } from '@/lib/photoStorage';
import { MAX_HOUSE_PHOTOS, photoLocationSchema, photoMetaSchema } from '@/lib/validation';

export type HousePhotoView = { id: string; url: string; lat: number | null; lng: number | null; locationSource: string | null };
type Result = { photo?: HousePhotoView; error?: string };

const MAX_PHOTO_BYTES = 3_000_000;
const PENDING_TTL_MS = 24 * 60 * 60 * 1000;
/** Photos added to one entry within this window share a single admin email. */
const NOTIFY_QUIET_MS = 10 * 60 * 1000;

function refresh() {
  revalidatePath('/profile');
  revalidatePath('/');
}

/** Removes submit-form uploads that never became part of an entry. */
async function sweepAbandoned(ownerId: string) {
  const stale = await db.housePhoto.findMany({ where: { ownerId, houseId: null, createdAt: { lt: new Date(Date.now() - PENDING_TTL_MS) } }, select: { id: true, blobUrl: true } });
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
    `New photo on ${house.name}`,
    [
      `${user.username} <${user.email}> added a photo to ${house.name}${live ? ', which is live on the site now' : ''}.`,
      '',
      ...house.photoUrls.map((u) => absolutePhotoUrl(u)),
      '',
      `${live ? 'Review it (take it down if needed)' : 'Approve or reject it'}: ${reviewUrl(house)}`,
    ].join('\n'),
    'submission',
    user.email,
  );
}

export async function uploadHousePhoto(fd: FormData): Promise<Result> {
  const user = await requireUser('/profile');
  if (user.accountType !== 'HOST') return { error: 'Only hosts can add house photos.' };
  const file = fd.get('photo');
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose a photo to upload.' };
  if (file.size > MAX_PHOTO_BYTES) return { error: 'That photo is too large. Try one under 3 MB.' };
  const parsed = photoMetaSchema.safeParse(Object.fromEntries([...fd].filter(([k]) => k !== 'photo')));
  if (!parsed.success) return { error: 'We could not read that photo’s details. Try again.' };
  const m = parsed.data;
  const data = Buffer.from(await file.arrayBuffer());
  const contentType = sniffImage(data);
  if (!contentType) return { error: 'Use a JPEG, PNG or WebP photo.' };

  if (m.houseId) {
    const house = await db.house.findFirst({ where: { id: m.houseId, ownerId: user.id }, select: { id: true } });
    if (!house) return { error: 'That entry was not found.' };
  } else {
    await sweepAbandoned(user.id);
  }
  const count = await db.housePhoto.count({ where: { ownerId: user.id, houseId: m.houseId ?? null } });
  if (count >= MAX_HOUSE_PHOTOS) return { error: `You can add up to ${MAX_HOUSE_PHOTOS} photos per house.` };

  const row = await db.housePhoto.create({
    data: {
      ownerId: user.id,
      houseId: m.houseId ?? null,
      url: '',
      width: m.width,
      height: m.height,
      lat: m.lat ?? null,
      lng: m.lng ?? null,
      locationSource: m.locationSource ?? null,
      takenAt: m.takenAt ?? null,
      position: count,
    },
  });
  let blobUrl: string | null;
  try {
    blobUrl = await storePhotoFile(row.id, data, contentType);
  } catch (err) {
    console.error('[photos] upload failed', err);
    await db.housePhoto.delete({ where: { id: row.id } });
    return { error: 'We could not save that photo. Try again in a moment.' };
  }
  const photo = await db.housePhoto.update({ where: { id: row.id }, data: { url: blobUrl ?? `/house-photo/${row.id}`, blobUrl }, select: photoSelect });
  if (m.houseId) {
    await syncHousePhotos(m.houseId);
    await notifyNewPhoto(m.houseId, row.id, user);
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
