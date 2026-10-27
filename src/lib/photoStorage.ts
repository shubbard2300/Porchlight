import 'server-only';
import { del, get, put } from '@vercel/blob';
import { db } from './db';

/**
 * House photos go to a private Vercel Blob store when one is connected (BLOB_READ_WRITE_TOKEN is set).
 * Without one they are kept in Postgres. Either way the site serves them from /house-photo/<id>.
 */
export const blobEnabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

/** Saves the image bytes for a HousePhoto row that already exists. Returns the Blob URL, or null for Postgres. */
export async function storePhotoFile(photoId: string, data: Buffer, contentType: string) {
  if (blobEnabled()) {
    const ext = contentType.split('/')[1];
    const blob = await put(`houses/${photoId}.${ext}`, data, { access: 'private', contentType, addRandomSuffix: true });
    return blob.url;
  }
  await db.housePhotoFile.create({ data: { photoId, contentType, data: new Uint8Array(data) } });
  return null;
}

/** Streams a private Blob file, or null if it is gone. */
export async function readBlobFile(blobUrl: string) {
  const res = await get(blobUrl, { access: 'private' });
  return res?.statusCode === 200 ? res : null;
}

/** Removes Blob files. Postgres-stored files go with their row through the cascade. */
export async function deletePhotoFiles(blobUrls: (string | null)[]) {
  const remote = blobUrls.filter((u): u is string => Boolean(u));
  if (remote.length === 0 || !blobEnabled()) return;
  try {
    await del(remote);
  } catch (err) {
    console.error('[photos] could not delete from Blob', err);
  }
}
