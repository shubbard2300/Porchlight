import { db } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const avatar = await db.avatar.findUnique({ where: { userId: (await params).id } });
  if (!avatar) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(avatar.data), {
    headers: {
      'Content-Type': avatar.contentType,
      'Cache-Control': 'public, max-age=86400, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
