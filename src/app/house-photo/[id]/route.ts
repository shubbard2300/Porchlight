import { db } from '@/lib/db';
import { readBlobFile } from '@/lib/photoStorage';

const HEADERS = { 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' };

/** Serves house photos from the private Blob store, or from Postgres when Blob isn't set up. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const photo = await db.housePhoto.findUnique({ where: { id: (await params).id }, select: { blobUrl: true, file: true } });
  if (photo?.file) {
    return new Response(new Uint8Array(photo.file.data), { headers: { ...HEADERS, 'Content-Type': photo.file.contentType } });
  }
  const blob = photo?.blobUrl ? await readBlobFile(photo.blobUrl) : null;
  if (!blob) return new Response('Not found', { status: 404 });
  return new Response(blob.stream, { headers: { ...HEADERS, 'Content-Type': blob.blob.contentType ?? 'image/jpeg' } });
}
