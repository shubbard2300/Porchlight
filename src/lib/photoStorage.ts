import 'server-only';
import { del, put } from '@vercel/blob';
import { db } from './db';

/**
 * House photos go to Vercel Blob when a store is connected (BLOB_READ_WRITE_TOKEN is set).
 * Without one they are kept in Postgres and served from /house-photo/<id>, so uploads work either way.
 */
export const blobEnabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

/** Saves the image bytes for a HousePhoto row that already exists and returns its public URL. */
export async function storePhotoFile(photoId: string, data: Buffer, contentType: string) {
  if (blobEnabled()) {
    const ext = contentType.split('/')[1];
    const blob = await put(`houses/${photoId}.${ext}`, data, { access: 'public', contentType, addRandomSuffix: true });
    return blob.url;
  }
  await db.housePhotoFile.create({ data: { photoId, contentType, data: new Uint8Array(data) } });
  return `/house-photo/${photoId}`;
}

/** Removes Blob files. Postgres-stored files go with their row through the cascade. */
export async function deletePhotoFiles(urls: string[]) {
  const remote = urls.filter((u) => u.startsWith('https://'));
  if (remote.length === 0 || !blobEnabled()) return;
  try {
    await del(remote);
  } catch (err) {
    console.error('[photos] could not delete from Blob', err);
  }
}
