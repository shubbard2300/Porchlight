import { db } from '@/lib/db';

/** Serves house photos stored in Postgres (used until a Vercel Blob store is connected). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const file = await db.housePhotoFile.findUnique({ where: { photoId: (await params).id } });
  if (!file) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(file.data), {
    headers: {
      'Content-Type': file.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
