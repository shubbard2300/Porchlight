import 'server-only';
import type { HouseStatus } from '@prisma/client';
import { db } from './db';
import { appUrl } from './email';
import { sniffImage } from './images';
import { deletePhotoFiles, storePhotoFile } from './photoStorage';
import { MAX_HOUSE_PHOTOS, type photoMetaSchema } from './validation';
import type { z } from 'zod';

/** Fields the browser needs to show a photo. Never selects the stored bytes. */
export const photoSelect = { id: true, url: true, lat: true, lng: true, locationSource: true } as const;

export const MAX_PHOTO_BYTES = 3_000_000;
/** Photos uploaded before there is an entry (at sign-up or on the submit form) wait this long for one. */
export const PENDING_PHOTO_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Checks and stores one uploaded photo for its owner, loose (no houseId) or on an entry.
 * Returns the saved photo, or an error to show the person.
 */
export async function savePhoto(ownerId: string, file: File, meta: Omit<z.infer<typeof photoMetaSchema>, 'houseId'>, houseId: string | null = null) {
  if (file.size > MAX_PHOTO_BYTES) return { error: 'That photo is too large. Try one under 3 MB.' };
  const data = Buffer.from(await file.arrayBuffer());
  const contentType = sniffImage(data);
  if (!contentType) return { error: 'Use a JPEG, PNG or WebP photo.' };
  const count = await db.housePhoto.count({ where: { ownerId, houseId } });
  if (count >= MAX_HOUSE_PHOTOS) return { error: `You can add up to ${MAX_HOUSE_PHOTOS} photos per house.` };

  const row = await db.housePhoto.create({
    data: {
      ownerId,
      houseId,
      url: '',
      width: meta.width,
      height: meta.height,
      lat: meta.lat ?? null,
      lng: meta.lng ?? null,
      locationSource: meta.locationSource ?? null,
      takenAt: meta.takenAt ?? null,
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
  return { photo };
}

/**
 * Copies the photo order into House.photoUrls (what the house cards read) and, if the house
 * has no map position yet, takes it from the first photo that has one.
 */
export async function syncHousePhotos(houseId: string) {
  const [house, photos] = await Promise.all([
    db.house.findUnique({ where: { id: houseId }, select: { lat: true } }),
    db.housePhoto.findMany({ where: { houseId }, orderBy: [{ position: 'asc' }, { createdAt: 'asc' }], select: { url: true, lat: true, lng: true } }),
  ]);
  if (!house) return;
  const located = photos.find((p) => p.lat !== null && p.lng !== null);
  await db.house.update({
    where: { id: houseId },
    data: {
      photoUrls: photos.map((p) => p.url),
      ...(house.lat === null && located ? { lat: located.lat, lng: located.lng } : {}),
    },
  });
}

/** Moves photos uploaded on the submit form (not yet tied to a house) onto the new entry. */
export async function attachPhotos(ownerId: string, houseId: string, ids: string[]) {
  const wanted = [...new Set(ids)].slice(0, MAX_HOUSE_PHOTOS);
  if (wanted.length === 0) return;
  const found = await db.housePhoto.findMany({ where: { id: { in: wanted }, ownerId, houseId: null }, select: { id: true } });
  const ok = new Set(found.map((p) => p.id));
  await db.$transaction(
    wanted.filter((id) => ok.has(id)).map((id, position) => db.housePhoto.update({ where: { id }, data: { houseId, position } })),
  );
  await syncHousePhotos(houseId);
}

/** Where an admin reviews this entry; the submissions page anchors each entry by id. */
export const reviewUrl = (h: { id: string; status: HouseStatus }) => appUrl(`/admin/submissions?status=${h.status}#h-${h.id}`);

/** Photo URLs are absolute on Blob and site-relative when stored in Postgres. */
export const absolutePhotoUrl = (url: string) => (url.startsWith('http') ? url : appUrl(url));

/** Deletes an entry with its photos, votes and comments, then removes its photo files from Blob. */
export async function deleteHouse(id: string) {
  const photos = await db.housePhoto.findMany({ where: { houseId: id }, select: { blobUrl: true } });
  await db.house.delete({ where: { id } });
  await deletePhotoFiles(photos.map((p) => p.blobUrl));
}
