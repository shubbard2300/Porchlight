import 'server-only';
import { db } from './db';
import { MAX_HOUSE_PHOTOS } from './validation';

/** Fields the browser needs to show a photo. Never selects the stored bytes. */
export const photoSelect = { id: true, url: true, lat: true, lng: true, locationSource: true } as const;

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
