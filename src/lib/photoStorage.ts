import 'server-only';
import { del, put } from '@vercel/blob';
import { db } from './db';

/**
 * House photos go to a public Vercel Blob store when one is connected to the project. Connecting sets a
 * store ID (the SDK then signs in with the deployment's OIDC token) or a BLOB_READ_WRITE_TOKEN.
 * The store ID's name follows the prefix picked when connecting: BLOB_STORE_ID by default,
 * PORCH_STORE_ID on the live project. Without either, photos are kept in Postgres.
 */
const storeId = () => process.env.BLOB_STORE_ID || process.env.PORCH_STORE_ID || undefined;
export const blobEnabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN || storeId());

/** Saves the image bytes for a HousePhoto row that already exists. Returns the Blob URL, or null for Postgres. */
export async function storePhotoFile(photoId: string, data: Buffer, contentType: string) {
  if (blobEnabled()) {
    const ext = contentType.split('/')[1];
    const blob = await put(`houses/${photoId}.${ext}`, data, { access: 'public', contentType, addRandomSuffix: true, storeId: storeId() });
    return blob.url;
  }
  console.warn('[photos] no Blob store connected; storing photo in Postgres');
  await db.housePhotoFile.create({ data: { photoId, contentType, data: new Uint8Array(data) } });
  return null;
}

/** Removes Blob files. Postgres-stored files go with their row through the cascade. */
export async function deletePhotoFiles(blobUrls: (string | null)[]) {
  const remote = blobUrls.filter((u): u is string => Boolean(u));
  if (remote.length === 0 || !blobEnabled()) return;
  try {
    await del(remote, { storeId: storeId() });
  } catch (err) {
    console.error('[photos] could not delete from Blob', err);
  }
}
